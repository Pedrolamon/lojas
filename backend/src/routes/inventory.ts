
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


// Inventory transaction routes
app.post('/inventory/entry', async (req, res) => {
  try {
    const { productId, quantity, unitCost } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newStock = product.currentStock + quantity;
    const newAverageCost = product.averageCost
      ? (product.averageCost * product.currentStock + unitCost * quantity) / newStock
      : unitCost;
    const investedValue = newAverageCost * newStock;

    await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'entry',
        quantity,
        unitCost,
      },
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        averageCost: newAverageCost,
        investedValue,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process entry' });
  }
});

app.post('/inventory/sale', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.currentStock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'sale',
        quantity,
      },
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: product.currentStock - quantity,
        lastSaleDate: new Date(),
        investedValue: product.averageCost ? product.averageCost * (product.currentStock - quantity) : 0,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process sale' });
  }
});

app.post('/inventory/loss', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.currentStock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'loss',
        quantity,
      },
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: product.currentStock - quantity,
        investedValue: product.averageCost ? product.averageCost * (product.currentStock - quantity) : 0,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process loss' });
  }
});

// Reports and alerts
app.get('/products/low-stock', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    const lowStock = products.filter(p => p.currentStock <= p.minStock);
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

app.get('/products/stagnant', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { lastSaleDate: null },
          { lastSaleDate: { lt: cutoffDate } },
        ],
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stagnant products' });
  }
});

app.get('/products/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const products = await prisma.product.findMany({
      where: {
        expirationDate: {
          lte: cutoffDate,
        },
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

export default app