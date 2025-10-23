import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';


const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Sales routes
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
        payments: true,
        fiscalDoc: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { customerId, userId, items, payments, discount = 0 } = req.body;

    // Calculate total
    let total = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      if (product.currentStock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      total += item.quantity * item.unitPrice;
    }
    total -= discount;

    // Create sale
    const sale = await prisma.sale.create({
      data: {
        customerId,
        userId,
        total,
        discount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice - (item.discount || 0)
          }))
        },
        payments: {
          create: payments
        }
      },
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
        payments: true
      }
    });

    // Calculate and create commission
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.commissionValue > 0) {
      let commissionAmount = 0;
      if (user.commissionType === 'percentage') {
        commissionAmount = (total * user.commissionValue) / 100;
      } else {
        commissionAmount = user.commissionValue;
      }

      await prisma.commission.create({
        data: {
          userId,
          saleId: sale.id,
          amount: commissionAmount
        }
      });
    }

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: { decrement: item.quantity },
          lastSaleDate: new Date(),
          investedValue: {
            set: await prisma.product.findUnique({ where: { id: item.productId } })
              .then(p => p?.averageCost ? p.averageCost * (p.currentStock - item.quantity) : 0)
          }
        }
      });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Product search by barcode
app.get('/api/products/search/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search product' });
  }
});

// Returns routes
app.post('/api/returns', async (req, res) => {
  try {
    const { saleId, items, userId } = req.body;

    // Validate sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } } }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Create return record
    const returnRecord = await prisma.return.create({
      data: {
        saleId,
        userId,
        totalAmount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
      }
    });

    // Process return items
    const returnItems = [];
    for (const item of items) {
      // Create return item record
      const returnItem = await prisma.returnItem.create({
        data: {
          returnId: returnRecord.id,
          saleItemId: item.saleItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: item.reason
        },
        include: {
          saleItem: { include: { product: true } }
        }
      });

      returnItems.push(returnItem);

      // Update product stock (add back to inventory)
      await prisma.product.update({
        where: { id: returnItem.saleItem.productId },
        data: {
          currentStock: { increment: item.quantity }
        }
      });

      // Create inventory transaction for return
      await prisma.inventoryTransaction.create({
        data: {
          productId: returnItem.saleItem.productId,
          type: 'return',
          quantity: item.quantity,
          unitCost: returnItem.saleItem.product.averageCost || 0
        }
      });
    }

    res.json({
      return: returnRecord,
      items: returnItems
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({ error: 'Failed to process return' });
  }
});

app.get('/api/returns', async (req, res) => {
  try {
    const { saleId, limit = 50 } = req.query;
    const where: any = {};

    if (saleId) where.saleId = saleId;

    const returns = await prisma.return.findMany({
      where,
      include: {
        sale: {
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        },
        user: true,
        items: {
          include: {
            saleItem: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Sales reports
app.get('/api/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
        payments: true
      }
    });

    // Calculate metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      totalSales,
      totalRevenue,
      averageTicket,
      topProducts,
      sales
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// Sales by period (day, week, month)
app.get('/api/reports/sales-by-period', async (req, res) => {
  try {
    const { period = 'day', days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days as string));

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const groupedSales: { [key: string]: { date: string; sales: number; revenue: number; count: number } } = {};

    sales.forEach(sale => {
      let groupKey: string;
      const saleDate = new Date(sale.createdAt);

      if (period === 'day') {
        groupKey = saleDate.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(saleDate);
        weekStart.setDate(saleDate.getDate() - saleDate.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        groupKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        groupKey = saleDate.toISOString().split('T')[0];
      }

      if (!groupedSales[groupKey]) {
        groupedSales[groupKey] = {
          date: groupKey,
          sales: 0,
          revenue: 0,
          count: 0
        };
      }

      groupedSales[groupKey].sales += sale.total;
      groupedSales[groupKey].revenue += sale.total;
      groupedSales[groupKey].count += 1;
    });

    const result = Object.values(groupedSales).sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales by period report' });
  }
});


// Profit analysis report
app.get('/api/reports/profit-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true } }
      }
    });

    let totalRevenue = 0;
    let totalCostOfGoods = 0;

    sales.forEach(sale => {
      totalRevenue += sale.total;
      sale.items.forEach(item => {
        totalCostOfGoods += (item.product.averageCost || 0) * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCostOfGoods;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate profit by product
    const productProfits: { [key: string]: { name: string; revenue: number; cost: number; profit: number; margin: number } } = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        if (!productProfits[productId]) {
          productProfits[productId] = {
            name: item.product.name,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0
          };
        }

        const revenue = item.total;
        const cost = (item.product.averageCost || 0) * item.quantity;
        const profit = revenue - cost;

        productProfits[productId].revenue += revenue;
        productProfits[productId].cost += cost;
        productProfits[productId].profit += profit;
      });
    });

    // Calculate margins
    Object.values(productProfits).forEach(product => {
      product.margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
    });

    const topProfitableProducts = Object.values(productProfits)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    res.json({
      summary: {
        totalRevenue,
        totalCostOfGoods,
        grossProfit,
        grossMargin
      },
      topProfitableProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profit analysis report' });
  }
});

// Enhanced stagnant products report
app.get('/api/reports/stagnant-enhanced', async (req, res) => {
  try {
    const { days = 60 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string));

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { lastSaleDate: null },
          { lastSaleDate: { lt: cutoffDate } },
        ],
        currentStock: { gt: 0 }
      }
    });

    const stagnantValue = products.reduce((sum, product) => {
      return sum + ((product.averageCost || 0) * product.currentStock);
    }, 0);

    const stagnantByCategory = products.reduce((acc, product) => {
      const category = product.location || 'Sem categoria';
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0, products: [] };
      }
      acc[category].count += 1;
      acc[category].value += (product.averageCost || 0) * product.currentStock;
      acc[category].products.push({
        id: product.id,
        name: product.name,
        stock: product.currentStock,
        value: (product.averageCost || 0) * product.currentStock,
        lastSale: product.lastSaleDate
      });
      return acc;
    }, {} as any);

    res.json({
      totalStagnantProducts: products.length,
      totalStagnantValue: stagnantValue,
      stagnantByCategory: Object.entries(stagnantByCategory).map(([category, data]) => ({
        category,
        ...(data as object)
      })),
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        currentStock: product.currentStock,
        averageCost: product.averageCost,
        investedValue: product.investedValue,
        lastSaleDate: product.lastSaleDate,
        location: product.location,
        daysStagnant: product.lastSaleDate
          ? Math.floor((new Date().getTime() - new Date(product.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
          : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate enhanced stagnant report' });
  }
});

// Commission report
app.get('/api/reports/commissions', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (userId) {
      where.userId = userId;
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        user: true,
        sale: {
          include: {
            items: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalCommissions = commissions.reduce((sum, commission) => sum + commission.amount, 0);
    const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

    // Group by user
    const commissionsByUser = commissions.reduce((acc, commission) => {
      const userId = commission.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: commission.user.name,
          totalCommissions: 0,
          paidCommissions: 0,
          pendingCommissions: 0,
          commissionCount: 0
        };
      }
      acc[userId].totalCommissions += commission.amount;
      if (commission.status === 'paid') {
        acc[userId].paidCommissions += commission.amount;
      } else {
        acc[userId].pendingCommissions += commission.amount;
      }
      acc[userId].commissionCount += 1;
      return acc;
    }, {} as any);

    res.json({
      summary: {
        totalCommissions,
        paidCommissions,
        pendingCommissions
      },
      commissionsByUser: Object.values(commissionsByUser),
      commissions: commissions.map(commission => ({
        id: commission.id,
        userName: commission.user.name,
        saleId: commission.saleId,
        saleTotal: commission.sale.total,
        commissionAmount: commission.amount,
        status: commission.status,
        createdAt: commission.createdAt,
        paidDate: commission.paidDate
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate commission report' });
  }
});

export default app

