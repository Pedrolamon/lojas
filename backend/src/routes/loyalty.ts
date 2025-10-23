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

// Loyalty Program routes

// Get customer loyalty status
app.get('/api/customers/:id/loyalty', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        loyaltyPoints: customer.loyaltyPoints
      },
      transactions: customer.loyaltyTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loyalty status' });
  }
});

// Earn loyalty points
app.post('/api/customers/:id/loyalty/earn', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, description, saleId } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId: id,
        type: 'earned',
        points,
        description: description || 'Pontos ganhos',
        saleId
      }
    });

    // Update customer points
    await prisma.customer.update({
      where: { id },
      data: {
        loyaltyPoints: customer.loyaltyPoints + points
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to earn points' });
  }
});

// Redeem loyalty points
app.post('/api/customers/:id/loyalty/redeem', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, description } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.loyaltyPoints < points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId: id,
        type: 'redeemed',
        points: -points, // Negative for redemption
        description: description || 'Pontos resgatados'
      }
    });

    // Update customer points
    await prisma.customer.update({
      where: { id },
      data: {
        loyaltyPoints: customer.loyaltyPoints - points
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

// Loyalty Program management
app.get('/api/loyalty-programs', async (req, res) => {
  try {
    const programs = await prisma.loyaltyProgram.findMany({
      where: { isActive: true }
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loyalty programs' });
  }
});

app.post('/api/loyalty-programs', async (req, res) => {
  try {
    const { name, description, pointsPerReal } = req.body;
    const program = await prisma.loyaltyProgram.create({
      data: {
        name,
        description,
        pointsPerReal: pointsPerReal || 1
      }
    });
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create loyalty program' });
  }
});

// Auto-earn points on sale (call this when creating a sale)
app.post('/api/sales/:saleId/earn-points', async (req, res) => {
  try {
    const { saleId } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true }
    });

    if (!sale || !sale.customerId) {
      return res.status(400).json({ error: 'Sale not found or no customer associated' });
    }

    // Get active loyalty program
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true }
    });

    if (!program) {
      return res.json({ message: 'No active loyalty program' });
    }

    const pointsEarned = Math.floor(sale.total * program.pointsPerReal);

    if (pointsEarned > 0) {
      const transaction = await prisma.loyaltyTransaction.create({
        data: {
          customerId: sale.customerId,
          type: 'earned',
          points: pointsEarned,
          description: `Pontos ganhos na venda #${saleId}`,
          saleId
        }
      });

      // Update customer points
      await prisma.customer.update({
        where: { id: sale.customerId },
        data: {
          loyaltyPoints: (sale.customer?.loyaltyPoints || 0) + pointsEarned
        }
      });

      res.json({ transaction, pointsEarned });
    } else {
      res.json({ message: 'No points earned' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to earn points on sale' });
  }
});

export default app
