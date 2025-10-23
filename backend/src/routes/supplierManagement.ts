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

// Supplier Management routes

// Supplier CRUD
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          include: {
            items: { include: { product: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        reliabilityHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
      include: {
        purchaseOrders: {
          include: {
            items: { include: { product: true } }
          }
        },
        reliabilityHistory: true
      }
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({
      where: { id },
    });
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Purchase Order Management
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const { supplierId, status } = req.query;
    const where: any = {};

    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { supplierId, items, expectedDate, notes } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitCost;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotal
      };
    });

    // Generate order number
    const orderNumber = `PO-${Date.now()}`;

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        supplier: true,
        items: { include: { product: true } }
      }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

app.put('/api/purchase-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, receivedDate } = req.body;

    const updateData: any = { status };
    if (receivedDate) updateData.receivedDate = new Date(receivedDate);

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        items: { include: { product: true } }
      }
    });

    // Update reliability score based on delivery
    if (status === 'received' && order.expectedDate && order.receivedDate) {
      const expectedTime = order.expectedDate.getTime();
      const receivedTime = order.receivedDate.getTime();
      const daysDifference = Math.ceil((receivedTime - expectedTime) / (1000 * 60 * 60 * 24));

      let scoreChange = 0;
      let eventType = 'on_time_delivery';

      if (daysDifference <= 0) {
        scoreChange = 5; // On time or early
        eventType = 'on_time_delivery';
      } else if (daysDifference <= 3) {
        scoreChange = -2; // Slightly late
        eventType = 'late_delivery';
      } else {
        scoreChange = -5; // Very late
        eventType = 'late_delivery';
      }

      // Record reliability event
      await prisma.reliabilityHistory.create({
        data: {
          supplierId: order.supplierId,
          eventType,
          description: `Pedido ${order.orderNumber} - ${daysDifference > 0 ? `${daysDifference} dias de atraso` : 'no prazo'}`,
          scoreChange,
          orderId: order.id
        }
      });

      // Update supplier reliability score
      const supplier = await prisma.supplier.findUnique({
        where: { id: order.supplierId }
      });

      if (supplier) {
        const newScore = Math.max(0, Math.min(100, supplier.reliabilityScore + scoreChange));
        await prisma.supplier.update({
          where: { id: order.supplierId },
          data: { reliabilityScore: newScore }
        });
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update purchase order item received quantity
app.put('/api/purchase-orders/:orderId/items/:itemId', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { receivedQuantity } = req.body;

    const item = await prisma.purchaseOrderItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    let status = 'pending';
    if (receivedQuantity >= item.quantity) {
      status = 'received';
    } else if (receivedQuantity > 0) {
      status = 'partial';
    }

    const updatedItem = await prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        receivedQuantity,
        status
      },
      include: { product: true }
    });

    // Update product inventory if fully received
    if (status === 'received' && item.receivedQuantity === 0) {
      // Add to inventory
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          type: 'entry',
          quantity: item.quantity,
          unitCost: item.unitCost
        }
      });

      // Update product stock and average cost
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const newStock = product.currentStock + item.quantity;
        const newAverageCost = product.averageCost
          ? (product.averageCost * product.currentStock + item.unitCost * item.quantity) / newStock
          : item.unitCost;
        const investedValue = newAverageCost * newStock;

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock,
            averageCost: newAverageCost,
            investedValue,
            costPrice: item.unitCost // Update last cost price
          }
        });
      }
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Supplier Reports
app.get('/api/reports/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          include: {
            items: { include: { product: true } }
          }
        },
        reliabilityHistory: true
      }
    });

    const report = suppliers.map(supplier => {
      const totalOrders = supplier.purchaseOrders.length;
      const completedOrders = supplier.purchaseOrders.filter(o => o.status === 'received').length;
      const pendingOrders = supplier.purchaseOrders.filter(o => o.status === 'pending' || o.status === 'ordered').length;
      const totalSpent = supplier.purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        supplier: supplier.name,
        reliabilityScore: supplier.reliabilityScore,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate supplier report' });
  }
});

// Product Cost Analysis Report
app.get('/api/reports/product-costs', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        PurchaseOrderItem: {
          include: {
            purchaseOrder: {
              include: { supplier: true }
            }
          }
        }
      }
    });

    const report = products.map(product => {
      const purchaseHistory = product.PurchaseOrderItem.filter(item =>
        item.purchaseOrder.status === 'received'
      );

      const costs = purchaseHistory.map(item => item.unitCost);
      const averageCost = costs.length > 0
        ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length
        : 0;

      const lastCost = costs.length > 0 ? costs[costs.length - 1] : 0;
      const minCost = costs.length > 0 ? Math.min(...costs) : 0;
      const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

      return {
        product: product.name,
        currentStock: product.currentStock,
        averageCost,
        lastCost,
        minCost,
        maxCost,
        sellingPrice: product.sellingPrice,
        profitMargin: averageCost > 0 ? ((product.sellingPrice - averageCost) / averageCost) * 100 : 0,
        suppliers: purchaseHistory.map(item => ({
          supplier: item.purchaseOrder.supplier.name,
          cost: item.unitCost,
          date: item.purchaseOrder.receivedDate
        }))
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cost analysis report' });
  }
});

// Pending Orders Report
app.get('/api/reports/pending-orders', async (req, res) => {
  try {
    const pendingOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['pending', 'approved', 'ordered']
        }
      },
      include: {
        supplier: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { expectedDate: 'asc' }
    });

    const report = pendingOrders.map(order => ({
      orderNumber: order.orderNumber,
      supplier: order.supplier.name,
      status: order.status,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      totalAmount: order.totalAmount,
      items: order.items.map(item => ({
        product: item.product.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        receivedQuantity: item.receivedQuantity
      }))
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate pending orders report' });
  }
});

export default app