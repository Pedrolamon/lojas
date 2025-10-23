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

// Customer purchase history
app.get('/api/customers/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            items: { include: { product: true } },
            payments: true,
            user: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer history' });
  }
});

// Credit Control routes

// Get customer credit status
app.get('/api/customers/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        creditTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const availableCredit = customer.creditLimit - customer.currentDebt;
    const overdueTransactions = customer.creditTransactions.filter(
      t => t.status === 'overdue'
    );

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        availableCredit
      },
      transactions: customer.creditTransactions,
      overdueTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit status' });
  }
});

// Add credit transaction (sale on credit)
app.post('/api/customers/:id/credit/sale', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, dueDate } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.currentDebt + amount > customer.creditLimit) {
      return res.status(400).json({ error: 'Credit limit exceeded' });
    }

    const transaction = await prisma.creditTransaction.create({
      data: {
        customerId: id,
        type: 'sale',
        amount,
        description: description || 'Venda a prazo',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    // Update customer debt
    await prisma.customer.update({
      where: { id },
      data: {
        currentDebt: customer.currentDebt + amount
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create credit sale' });
  }
});

// Process credit payment
app.post('/api/customers/:id/credit/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transaction = await prisma.creditTransaction.create({
      data: {
        customerId: id,
        type: 'payment',
        amount: -amount, // Negative for payments
        description: description || 'Pagamento de dívida',
        paidDate: new Date(),
        status: 'paid'
      }
    });

    // Update customer debt
    const newDebt = Math.max(0, customer.currentDebt - amount);
    await prisma.customer.update({
      where: { id },
      data: {
        currentDebt: newDebt
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default app