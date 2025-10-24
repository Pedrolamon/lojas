
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { backupManager } from "../backup"

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


// Financial Reports

// Accounts Payable Report
app.get('/reports/accounts-payable', async (req, res) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    const where: any = { type: 'payable' };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        supplier: true,
        category: true,
        costCenter: true,
        user: true
      },
      orderBy: { dueDate: 'asc' }
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const overdueAmount = transactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      summary: {
        totalAmount,
        overdueAmount,
        pendingAmount: totalAmount - overdueAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate accounts payable report' });
  }
});

// Accounts Receivable Report
app.get('/reports/accounts-receivable', async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    const where: any = { type: 'receivable' };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        customer: true,
        category: true,
        costCenter: true,
        user: true
      },
      orderBy: { dueDate: 'asc' }
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const overdueAmount = transactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      summary: {
        totalAmount,
        overdueAmount,
        pendingAmount: totalAmount - overdueAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate accounts receivable report' });
  }
});

// Cash Flow Report
app.get('/reports/cash-flow', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        category: true,
        costCenter: true
      }
    });

    const inflows = transactions.filter(t => t.type === 'income' || t.type === 'receivable');
    const outflows = transactions.filter(t => t.type === 'expense' || t.type === 'payable');

    const totalInflows = inflows.reduce((sum, t) => sum + t.amount, 0);
    const totalOutflows = outflows.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalInflows - totalOutflows;

    res.json({
      inflows,
      outflows,
      summary: {
        totalInflows,
        totalOutflows,
        netCashFlow
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cash flow report' });
  }
});

// Profit & Loss (DRE) Report
app.get('/reports/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        category: true
      }
    });

    const sales = await prisma.sale.findMany({
      where: startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      } : {},
      include: {
        items: { include: { product: true } }
      }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCostOfGoods = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (item.product.averageCost || 0) * item.quantity;
      }, 0);
    }, 0);

    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      revenue: totalRevenue,
      costOfGoods: totalCostOfGoods,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      expensesByCategory: expenses.reduce((acc, expense) => {
        const category = expense.category?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profit & loss report' });
  }
});

// Break-even Analysis
app.get('/reports/break-even', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const fixedExpenses = await prisma.financialTransaction.findMany({
      where: {
        ...where,
        type: 'expense',
        category: {
          type: 'fixed'
        }
      }
    });

    const sales = await prisma.sale.findMany({
      where: startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      } : {},
      include: {
        items: { include: { product: true } }
      }
    });

    const totalFixedCosts = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalVariableCosts = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (item.product.averageCost || 0) * item.quantity;
      }, 0);
    }, 0);

    const averageContributionMargin = totalRevenue > 0
      ? ((totalRevenue - totalVariableCosts) / totalRevenue) * 100
      : 0;

    const breakEvenPoint = averageContributionMargin > 0
      ? totalFixedCosts / (averageContributionMargin / 100)
      : 0;

    res.json({
      totalFixedCosts,
      totalVariableCosts,
      totalRevenue,
      averageContributionMargin,
      breakEvenPoint
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate break-even point' });
  }
});

// Delinquency Report
app.get('/reports/delinquency', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string));

    const delinquentTransactions = await prisma.financialTransaction.findMany({
      where: {
        status: 'overdue',
        dueDate: { lt: cutoffDate }
      },
      include: {
        customer: true,
        supplier: true,
        category: true,
        costCenter: true
      },
      orderBy: { dueDate: 'asc' }
    });

    // Group by customer/supplier
    const delinquencyByEntity: { [key: string]: any } = {};
    delinquentTransactions.forEach(transaction => {
      const entityKey = transaction.customerId || transaction.supplierId;
      if (!entityKey) return; // Skip if no entity key

      const entityName = transaction.customer?.name || transaction.supplier?.name || 'N/A';

      if (!delinquencyByEntity[entityKey]) {
        delinquencyByEntity[entityKey] = {
          entityId: entityKey,
          entityName,
          entityType: transaction.customerId ? 'customer' : 'supplier',
          totalAmount: 0,
          transactions: [],
          oldestDueDate: transaction.dueDate
        };
      }

      delinquencyByEntity[entityKey].totalAmount += transaction.amount;
      delinquencyByEntity[entityKey].transactions.push(transaction);

      if (transaction.dueDate && delinquencyByEntity[entityKey].oldestDueDate &&
          transaction.dueDate < delinquencyByEntity[entityKey].oldestDueDate) {
        delinquencyByEntity[entityKey].oldestDueDate = transaction.dueDate;
      }
    });

    const summary = {
      totalDelinquentAmount: delinquentTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalDelinquentTransactions: delinquentTransactions.length,
      uniqueDelinquentEntities: Object.keys(delinquencyByEntity).length,
      delinquencyByEntity: Object.values(delinquencyByEntity)
    };

    res.json({
      transactions: delinquentTransactions,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate delinquency report' });
  }
});

// Cash Flow Forecast
app.get('/reports/cash-flow-forecast', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const today = new Date();
    const forecastEndDate = new Date();
    forecastEndDate.setMonth(today.getMonth() + parseInt(months as string));

    // Get all pending transactions within forecast period
    const pendingTransactions = await prisma.financialTransaction.findMany({
      where: {
        status: { in: ['pending', 'overdue'] },
        dueDate: {
          gte: today,
          lte: forecastEndDate
        }
      },
      include: {
        category: true,
        costCenter: true
      }
    });

    // Get recurring entries
    const recurringEntries = await prisma.recurringEntry.findMany({
      where: {
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: today } }
        ]
      }
    });

    // Generate forecast data
    const forecastData: any[] = [];
    const currentDate = new Date(today);

    for (let i = 0; i < parseInt(months as string); i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0);

      // Filter transactions for this month
      const monthTransactions = pendingTransactions.filter(t =>
        t.dueDate && t.dueDate >= monthStart && t.dueDate <= monthEnd
      );

      // Calculate inflows and outflows for this month
      let inflows = monthTransactions
        .filter(t => t.type === 'receivable' || t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      let outflows = monthTransactions
        .filter(t => t.type === 'payable' || t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Add recurring entries for this month
      recurringEntries.forEach(entry => {
        if (shouldIncludeRecurringInMonth(entry, monthStart)) {
          if (entry.type === 'income') {
            inflows += entry.amount;
          } else {
            outflows += entry.amount;
          }
        }
      });

      forecastData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        inflows,
        outflows,
        netCashFlow: inflows - outflows,
        cumulativeCashFlow: forecastData.length > 0
          ? forecastData[forecastData.length - 1].cumulativeCashFlow + (inflows - outflows)
          : inflows - outflows
      });
    }

    res.json({
      forecast: forecastData,
      summary: {
        totalProjectedInflows: forecastData.reduce((sum, month) => sum + month.inflows, 0),
        totalProjectedOutflows: forecastData.reduce((sum, month) => sum + month.outflows, 0),
        netProjectedCashFlow: forecastData.reduce((sum, month) => sum + month.netCashFlow, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cash flow forecast' });
  }
});

// Helper function for recurring entries in forecast
function shouldIncludeRecurringInMonth(entry: any, monthStart: Date): boolean {
  const entryStart = new Date(entry.startDate);
  const entryEnd = entry.endDate ? new Date(entry.endDate) : null;

  if (entryStart > monthStart) return false;
  if (entryEnd && entryEnd < monthStart) return false;

  switch (entry.frequency) {
    case 'monthly':
      return true; // Monthly entries occur every month
    case 'yearly':
      return entryStart.getMonth() === monthStart.getMonth();
    case 'weekly':
      // For simplicity, assume weekly entries occur in the month
      return true;
    case 'daily':
      // For simplicity, assume daily entries occur in the month
      return true;
    default:
      return false;
  }
}

// Financial Alerts
app.get('/alerts/financial', async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Overdue transactions
    const overdueTransactions = await prisma.financialTransaction.findMany({
      where: {
        status: { in: ['pending', 'overdue'] },
        dueDate: { lt: today }
      },
      include: {
        supplier: true,
        customer: true
      }
    });

    // Due this week
    const dueThisWeek = await prisma.financialTransaction.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: today,
          lte: nextWeek
        }
      },
      include: {
        supplier: true,
        customer: true
      }
    });

    // Update overdue status
    for (const transaction of overdueTransactions) {
      if (transaction.status !== 'overdue') {
        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: { status: 'overdue' as const }
        });
      }
    }

    res.json({
      overdue: overdueTransactions,
      dueThisWeek,
      totalOverdueAmount: overdueTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalDueThisWeekAmount: dueThisWeek.reduce((sum, t) => sum + t.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial alerts' });
  }
});

// Recurring Entries Processing (should be called daily)
app.post('/recurring-entries/process', async (req, res) => {
  try {
    const today = new Date();
    const recurringEntries = await prisma.recurringEntry.findMany({
      where: {
        isActive: true,
        OR: [
          { lastGenerated: null },
          { lastGenerated: { lt: today } }
        ]
      }
    });

    const processed = [];

    for (const entry of recurringEntries) {
      const shouldGenerate = await shouldGenerateTransaction(entry, today);

      if (shouldGenerate) {
        const transaction = await prisma.financialTransaction.create({
          data: {
            type: entry.type === 'expense' ? 'expense' : 'income',
            description: entry.description,
            amount: entry.amount,
            categoryId: entry.categoryId,
            costCenterId: entry.costCenterId,
            supplierId: entry.supplierId,
            recurringId: entry.id,
            userId: req.body.userId || 'system'
          }
        });

        await prisma.recurringEntry.update({
          where: { id: entry.id },
          data: { lastGenerated: today }
        });

        processed.push(transaction);
      }
    }

    res.json({ processed: processed.length, transactions: processed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process recurring entries' });
  }
});

// Helper function to determine if transaction should be generated
async function shouldGenerateTransaction(entry: any, today: Date): Promise<boolean> {
  const lastGenerated = entry.lastGenerated || entry.startDate;
  const daysSinceLast = Math.floor((today.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24));

  switch (entry.frequency) {
    case 'daily':
      return daysSinceLast >= 1;
    case 'weekly':
      return daysSinceLast >= 7;
    case 'monthly':
      const lastMonth = lastGenerated.getMonth();
      const currentMonth = today.getMonth();
      const lastYear = lastGenerated.getFullYear();
      const currentYear = today.getFullYear();
      return (currentYear > lastYear) || (currentYear === lastYear && currentMonth > lastMonth);
    case 'yearly':
      return today.getFullYear() > lastGenerated.getFullYear();
    default:
      return false;
  }
}

// Backup API endpoints
app.post('/backup/create', async (req, res) => {
  try {
    const backupPath = await backupManager.createBackup();
    res.json({ success: true, backupPath });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.get('/backup/list', async (req, res) => {
  try {
    const backups = backupManager.listBackups();
    const backupInfo = backupManager.getBackupInfo();
    res.json({ backups, info: backupInfo });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.post('/backup/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await backupManager.restoreBackup(filename);
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

app.post('/backup/cleanup', async (req, res) => {
  try {
    const { keepCount = 10 } = req.body;
    await backupManager.cleanupOldBackups(keepCount);
    res.json({ success: true, message: 'Old backups cleaned up' });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({ error: 'Failed to cleanup backups' });
  }
});

// History endpoints for cash register and stock movements
app.get('/history/cash-movements', async (req, res) => {
  try {
    const { userId, startDate, endDate, limit = 100 } = req.query;
    const where: any = {};

    if (userId && typeof userId === 'string') {
      // Find cash registers for this user
      const cashRegisters = await prisma.cashRegister.findMany({
        where: { userId },
        select: { id: true }
      });
      where.cashRegisterId = { in: cashRegisters.map(cr => cr.id) };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const movements = await prisma.cashMovement.findMany({
      where,
      include: {
        cashRegister: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(movements);
  } catch (error) {
    console.error('Error fetching cash movements history:', error);
    res.status(500).json({ error: 'Failed to fetch cash movements history' });
  }
});

app.get('/history/stock-movements', async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = 100 } = req.query;
    const where: any = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: true
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching stock movements history:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements history' });
  }
});

// Schedule automatic backup (runs every 24 hours)
backupManager.scheduleAutomaticBackup(24);


export default app
