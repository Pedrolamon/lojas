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

// Cash Register routes

// Open cash register
app.post('/api/cash-register/open', async (req, res) => {
  try {
    const { userId, initialAmount } = req.body;

    // Check if user already has an open cash register
    const existingOpen = await prisma.cashRegister.findFirst({
      where: { userId, status: 'open' }
    });

    if (existingOpen) {
      return res.status(400).json({ error: 'User already has an open cash register' });
    }

    const cashRegister = await prisma.cashRegister.create({
      data: {
        userId,
        initialAmount: parseFloat(initialAmount),
        expectedAmount: parseFloat(initialAmount)
      },
      include: { user: true }
    });

    res.json(cashRegister);
  } catch (error) {
    res.status(500).json({ error: 'Failed to open cash register' });
  }
});

// Get current open cash register for user
app.get('/api/cash-register/current/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'open' },
      include: { movements: true, user: true }
    });

    if (!cashRegister) {
      return res.status(404).json({ error: 'No open cash register found' });
    }

    res.json(cashRegister);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cash register' });
  }
});

// Sangria (withdrawal)
app.post('/api/cash-register/withdrawal', async (req, res) => {
  try {
    const { cashRegisterId, amount, description } = req.body;

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId }
    });

    if (!cashRegister || cashRegister.status !== 'open') {
      return res.status(400).json({ error: 'Invalid or closed cash register' });
    }

    if ((cashRegister.expectedAmount || 0) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient funds for withdrawal' });
    }

    // Create movement
    const movement = await prisma.cashMovement.create({
      data: {
        cashRegisterId,
        type: 'withdrawal',
        amount: -parseFloat(amount), // Negative for withdrawal
        description: description || 'Sangria'
      }
    });

    // Update expected amount
    const updatedCashRegister = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        expectedAmount: (cashRegister.expectedAmount || 0) - parseFloat(amount)
      },
      include: { movements: true, user: true }
    });

    res.json({ movement, cashRegister: updatedCashRegister });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Close cash register
app.post('/api/cash-register/close', async (req, res) => {
  try {
    const { cashRegisterId, actualAmount } = req.body;

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: { movements: true, user: true }
    });

    if (!cashRegister || cashRegister.status !== 'open') {
      return res.status(400).json({ error: 'Invalid or already closed cash register' });
    }

    // Calculate final expected amount including sales
    let totalSales = 0;
    const sales = await prisma.sale.findMany({
      where: {
        userId: cashRegister.userId,
        createdAt: {
          gte: cashRegister.openedAt,
          lte: new Date()
        }
      },
      include: { payments: true }
    });

    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (payment.method === 'cash') {
          totalSales += payment.amount;
        }
      });
    });

    const finalExpectedAmount = cashRegister.initialAmount + totalSales +
      cashRegister.movements.reduce((sum, movement) => sum + movement.amount, 0);

    const updatedCashRegister = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        closedAt: new Date(),
        actualAmount: parseFloat(actualAmount),
        expectedAmount: finalExpectedAmount,
        status: 'closed'
      },
      include: { movements: true, user: true }
    });

    const difference = parseFloat(actualAmount) - finalExpectedAmount;

    res.json({
      cashRegister: updatedCashRegister,
      report: {
        initialAmount: cashRegister.initialAmount,
        totalSales,
        totalMovements: cashRegister.movements.reduce((sum, movement) => sum + movement.amount, 0),
        expectedAmount: finalExpectedAmount,
        actualAmount: parseFloat(actualAmount),
        difference
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close cash register' });
  }
});

// Get cash register history
app.get('/api/cash-register/history', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const where: any = {};

    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.openedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const cashRegisters = await prisma.cashRegister.findMany({
      where,
      include: {
        user: true,
        movements: true
      },
      orderBy: { openedAt: 'desc' }
    });

    res.json(cashRegisters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cash register history' });
  }
});

// Movement report by operator
app.get('/api/reports/cash-movements', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
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
      orderBy: { createdAt: 'desc' }
    });

    // Group by user
    const reportByUser: { [key: string]: any } = {};
    movements.forEach(movement => {
      const userId = movement.cashRegister.userId;
      const userName = movement.cashRegister.user.name;

      if (!reportByUser[userId]) {
        reportByUser[userId] = {
          userId,
          userName,
          totalWithdrawals: 0,
          totalDeposits: 0,
          movements: []
        };
      }

      if (movement.type === 'withdrawal') {
        reportByUser[userId].totalWithdrawals += Math.abs(movement.amount);
      } else if (movement.type === 'deposit') {
        reportByUser[userId].totalDeposits += movement.amount;
      }

      reportByUser[userId].movements.push(movement);
    });

    res.json({
      movements,
      reportByUser: Object.values(reportByUser)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate movement report' });
  }
});

export default app