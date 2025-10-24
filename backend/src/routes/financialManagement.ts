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


// Financial Management Routes

// Expense Categories
app.get('/expense-categories', async (req, res) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

app.post('/expense-categories', async (req, res) => {
  try {
    const category = await prisma.expenseCategory.create({
      data: req.body
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense category' });
  }
});

app.put('/expense-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: req.body
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

app.delete('/expense-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Expense category deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense category' });
  }
});

// Cost Centers
app.get('/cost-centers', async (req, res) => {
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(costCenters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cost centers' });
  }
});

app.post('/cost-centers', async (req, res) => {
  try {
    const costCenter = await prisma.costCenter.create({
      data: req.body
    });
    res.json(costCenter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cost center' });
  }
});

app.put('/cost-centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const costCenter = await prisma.costCenter.update({
      where: { id },
      data: req.body
    });
    res.json(costCenter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cost center' });
  }
});

app.delete('/cost-centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.costCenter.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Cost center deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cost center' });
  }
});

// Recurring Entries
app.get('/recurring-entries', async (req, res) => {
  try {
    const entries = await prisma.recurringEntry.findMany({
      where: { isActive: true },
      include: {
        category: true,
        costCenter: true,
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recurring entries' });
  }
});

app.post('/recurring-entries', async (req, res) => {
  try {
    const entry = await prisma.recurringEntry.create({
      data: req.body,
      include: {
        category: true,
        costCenter: true,
        supplier: true
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recurring entry' });
  }
});

app.put('/recurring-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.recurringEntry.update({
      where: { id },
      data: req.body,
      include: {
        category: true,
        costCenter: true,
        supplier: true
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recurring entry' });
  }
});

app.delete('/recurring-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recurringEntry.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Recurring entry deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recurring entry' });
  }
});

// Financial Transactions
app.get('/financial-transactions', async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
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
        costCenter: true,
        supplier: true,
        customer: true,
        user: true,
        recurring: true,
        installment: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial transactions' });
  }
});

app.post('/financial-transactions', async (req, res) => {
  try {
    const { userId } = req.body;
    const transaction = await prisma.financialTransaction.create({
      data: req.body,
      include: {
        category: true,
        costCenter: true,
        supplier: true,
        customer: true,
        user: true,
        recurring: true,
        installment: true
      }
    });

    // Create log entry
    await prisma.financialLog.create({
      data: {
        transactionId: transaction.id,
        action: 'created' as const,
        userId,
        newValues: JSON.stringify(transaction)
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create financial transaction' });
  }
});

app.put('/financial-transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...updateData } = req.body;

    const oldTransaction = await prisma.financialTransaction.findUnique({
      where: { id }
    });

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        costCenter: true,
        supplier: true,
        customer: true,
        user: true,
        recurring: true,
        installment: true
      }
    });

    // Create log entry
    await prisma.financialLog.create({
      data: {
        transactionId: transaction.id,
        action: 'updated' as const,
        userId,
        oldValues: JSON.stringify(oldTransaction),
        newValues: JSON.stringify(transaction)
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update financial transaction' });
  }
});

// Pay transaction
app.post('/financial-transactions/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, paidDate } = req.body;

    const oldTransaction = await prisma.financialTransaction.findUnique({
      where: { id }
    });

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        status: 'paid',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      },
      include: {
        category: true,
        costCenter: true,
        supplier: true,
        customer: true,
        user: true,
        recurring: true,
        installment: true
      }
    });

    // Create log entry
    await prisma.financialLog.create({
      data: {
        transactionId: transaction.id,
        action: 'paid' as const,
        userId,
        oldValues: JSON.stringify(oldTransaction),
        newValues: JSON.stringify(transaction)
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pay transaction' });
  }
});


// Installments
app.get('/installments', async (req, res) => {
  try {
    const { customerId, supplierId, status } = req.query;
    const where: any = { isActive: true };

    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.transactions = { some: { status } };

    const installments = await prisma.installment.findMany({
      where,
      include: {
        customer: true,
        supplier: true,
        transactions: {
          include: {
            category: true,
            costCenter: true,
            user: true
          },
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch installments' });
  }
});

app.post('/installments', async (req, res) => {
  try {
    const { totalAmount, numberOfInstallments, startDate, ...installmentData } = req.body;

    const installmentAmount = totalAmount / numberOfInstallments;

    const installment = await prisma.installment.create({
      data: {
        ...installmentData,
        totalAmount,
        numberOfInstallments,
        installmentAmount,
        startDate: new Date(startDate)
      },
      include: {
        customer: true,
        supplier: true
      }
    });

    // Create installment transactions
    const transactions = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const transaction = await prisma.financialTransaction.create({
        data: {
          type: installment.customerId ? 'receivable' : 'payable',
          description: `${installment.description} - Parcela ${i + 1}/${numberOfInstallments}`,
          amount: installmentAmount,
          dueDate,
          categoryId: installmentData.categoryId,
          costCenterId: installmentData.costCenterId,
          supplierId: installment.supplierId,
          customerId: installment.customerId,
          installmentId: installment.id,
          userId: installmentData.userId
        }
      });
      transactions.push(transaction);
    }

    res.json({ installment, transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create installment' });
  }
});

app.put('/installments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const installment = await prisma.installment.update({
      where: { id },
      data: req.body,
      include: {
        customer: true,
        supplier: true,
        transactions: {
          include: {
            category: true,
            costCenter: true,
            user: true
          }
        }
      }
    });
    res.json(installment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update installment' });
  }
});

app.delete('/installments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.installment.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Installment deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete installment' });
  }
});

// Get installment details with payment status
app.get('/installments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const installment = await prisma.installment.findUnique({
      where: { id },
      include: {
        customer: true,
        supplier: true,
        transactions: {
          include: {
            category: true,
            costCenter: true,
            user: true
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!installment) {
      return res.status(404).json({ error: 'Installment not found' });
    }

    // Calculate payment summary
    const totalPaid = installment.transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = installment.transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOverdue = installment.transactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      ...installment,
      summary: {
        totalAmount: installment.totalAmount,
        totalPaid,
        totalPending,
        totalOverdue,
        remainingAmount: installment.totalAmount - totalPaid,
        paidInstallments: installment.transactions.filter(t => t.status === 'paid').length,
        pendingInstallments: installment.transactions.filter(t => t.status === 'pending').length,
        overdueInstallments: installment.transactions.filter(t => t.status === 'overdue').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch installment details' });
  }
});

export default app