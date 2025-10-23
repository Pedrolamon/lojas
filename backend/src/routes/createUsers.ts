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

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        commissionType: true,
        commissionValue: true,
        canCancelSales: true,
        canRefundSales: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, commissionType, commissionValue, canCancelSales, canRefundSales } = req.body;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        commissionType,
        commissionValue,
        canCancelSales,
        canRefundSales
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        commissionType: true,
        commissionValue: true,
        canCancelSales: true,
        canRefundSales: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, commissionType, commissionValue, canCancelSales, canRefundSales, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        password,
        role,
        commissionType,
        commissionValue,
        canCancelSales,
        canRefundSales,
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        commissionType: true,
        commissionValue: true,
        canCancelSales: true,
        canRefundSales: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default app