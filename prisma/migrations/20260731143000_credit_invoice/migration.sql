-- CreateTable
CREATE TABLE "CreditInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "openingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditInvoice_userId_year_month_idx" ON "CreditInvoice"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "CreditInvoice_accountId_idx" ON "CreditInvoice"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditInvoice_accountId_year_month_key" ON "CreditInvoice"("accountId", "year", "month");

-- AddForeignKey
ALTER TABLE "CreditInvoice" ADD CONSTRAINT "CreditInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditInvoice" ADD CONSTRAINT "CreditInvoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
