-- CreateEnum
CREATE TYPE "RecurringProposalDecisionType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RecurringProposalDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesKey" TEXT NOT NULL,
    "sourceTransactionId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "decision" "RecurringProposalDecisionType" NOT NULL,
    "createdTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringProposalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringProposalDecision_userId_decision_idx" ON "RecurringProposalDecision"("userId", "decision");

-- CreateIndex
CREATE INDEX "RecurringProposalDecision_userId_proposedDate_idx" ON "RecurringProposalDecision"("userId", "proposedDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringProposalDecision_userId_seriesKey_proposedDate_key" ON "RecurringProposalDecision"("userId", "seriesKey", "proposedDate");

-- AddForeignKey
ALTER TABLE "RecurringProposalDecision" ADD CONSTRAINT "RecurringProposalDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
