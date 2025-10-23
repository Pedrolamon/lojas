-- CreateTable
CREATE TABLE "CashRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "initialAmount" REAL NOT NULL,
    "expectedAmount" REAL,
    "actualAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashRegister_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cashRegisterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
