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

// Product routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', upload.single('photo'), async (req, res) => {
  try {
    const { name, barcode, costPrice, sellingPrice, location, expirationDate, minStock } = req.body;
    const photo = req.file ? req.file.filename : null;

    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        photo,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        location,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        minStock: parseInt(minStock),
        currentStock: 0,
      },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.expirationDate) data.expirationDate = new Date(data.expirationDate);
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default app