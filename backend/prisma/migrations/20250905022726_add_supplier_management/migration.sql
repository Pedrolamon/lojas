-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "ie" TEXT,
    "cnae" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "representativeName" TEXT,
    "representativePhone" TEXT,
    "representativeEmail" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankAgency" TEXT,
    "pixKey" TEXT,
    "defaultPaymentTerms" TEXT,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReliabilityHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "scoreChange" INTEGER NOT NULL,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReliabilityHistory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cnpj_key" ON "Supplier"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");
