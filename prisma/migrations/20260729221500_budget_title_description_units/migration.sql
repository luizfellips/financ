-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "title" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "unitCost" DECIMAL(14,2),
ADD COLUMN     "quantityLimit" INTEGER;
