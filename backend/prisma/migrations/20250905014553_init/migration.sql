-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "photo" TEXT,
    "costPrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "location" TEXT,
    "expirationDate" DATETIME,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "averageCost" REAL,
    "investedValue" REAL,
    "lastSaleDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
