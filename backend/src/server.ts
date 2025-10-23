import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';

//Routes
import auth from "./routes/auth"
import CashRegister  from './routes/cashRegister';
import createUsers from "./routes/createUsers"
import customer from "./routes/customer"
import customerPurchese from "./routes/customerPurchase"
import financialManagement from "./routes/financialManagement"
import financialReports from "./routes/financialReports"
import inventory from "./routes/inventory"
import loyalty from "./routes/loyalty"
import Product from "./routes/products"
import sales from "./routes/sales"
import supplierManagement from "./routes/supplierManagement"


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

app.use("/api/auth", auth);
app.use("/api/CashRegister", CashRegister);
app.use("/api/createUsers",createUsers );
app.use("/api/customer", customer);
app.use("/api/customerPurchese",customerPurchese );
app.use("/api/financialManagement", financialManagement);
app.use("/api/financialReports", financialReports);
app.use("/api/inventory", inventory);
app.use("/api/loyalty", loyalty);
app.use("/api/Product", Product);
app.use("/api/sales", sales);
app.use("/api/supplierManagement", supplierManagement);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
