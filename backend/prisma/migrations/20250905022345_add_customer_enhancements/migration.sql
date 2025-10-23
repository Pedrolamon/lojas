-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreditTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "saleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerReal" REAL NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "address" TEXT,
    "birthDate" DATETIME,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "currentDebt" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "createdAt", "document", "email", "id", "name", "phone", "updatedAt") SELECT "address", "createdAt", "document", "email", "id", "name", "phone", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "Customer_document_key" ON "Customer"("document");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
