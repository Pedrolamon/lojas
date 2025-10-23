
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

// Customer routes
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          include: {
            items: { include: { product: true } },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        creditTransactions: true,
        loyaltyTransactions: true
      }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, document, address, birthDate, creditLimit } = req.body;
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        document,
        address,
        birthDate: birthDate ? new Date(birthDate) : null,
        creditLimit: creditLimit || 0
      },
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as any;
    if (data.birthDate) data.birthDate = new Date(data.birthDate);

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        sales: {
          include: {
            items: { include: { product: true } },
            payments: true
          }
        },
        creditTransactions: true,
        loyaltyTransactions: true
      }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({
      where: { id },
    });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default app