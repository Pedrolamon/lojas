-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecurringEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "categoryId" TEXT,
    "costCenterId" TEXT,
    "supplierId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGenerated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringEntry_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "categoryId" TEXT,
    "costCenterId" TEXT,
    "supplierId" TEXT,
    "customerId" TEXT,
    "recurringId" TEXT,
    "installmentId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "installmentAmount" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "customerId" TEXT,
    "supplierId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Installment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Installment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinancialLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Return_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Return_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'seller',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "commissionValue" REAL NOT NULL DEFAULT 0,
    "canCancelSales" BOOLEAN NOT NULL DEFAULT false,
    "canRefundSales" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isActive", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
