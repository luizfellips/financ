-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "transferToAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_userId_transferToAccountId_idx" ON "Transaction"("userId", "transferToAccountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
