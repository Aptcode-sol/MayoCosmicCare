-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterEnum
ALTER TYPE "TxType" ADD VALUE 'LEADERSHIP_BONUS';

-- AlterEnum
ALTER TYPE "WithdrawalStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "PairPayoutRecord" ADD COLUMN     "leftConsumed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rightConsumed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "adminChargePercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "dailyCap" INTEGER NOT NULL DEFAULT 40000,
ADD COLUMN     "directBonus" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN     "keyFeatures" TEXT,
ADD COLUMN     "matchingBonus" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhaar" TEXT,
ADD COLUMN     "hasPurchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kycRefId" TEXT,
ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN     "name" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "rank" TEXT NOT NULL DEFAULT 'Rookie',
ADD COLUMN     "totalPairs" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "isEmailVerified" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "cfStatus" TEXT,
ADD COLUMN     "cfTransferId" TEXT;

-- CreateTable
CREATE TABLE "RankChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRank" TEXT NOT NULL,
    "toRank" TEXT NOT NULL,
    "pairsAtChange" INTEGER NOT NULL,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,
    "rewardedAt" TIMESTAMP(3),
    "rewardedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLeadershipCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyLeadershipCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "cashfreeOrderId" TEXT,
    "paymentSessionId" TEXT,
    "sponsorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCounter" (
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserCounter_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE INDEX "RankChange_userId_idx" ON "RankChange"("userId");

-- CreateIndex
CREATE INDEX "RankChange_toRank_idx" ON "RankChange"("toRank");

-- CreateIndex
CREATE INDEX "RankChange_rewarded_idx" ON "RankChange"("rewarded");

-- CreateIndex
CREATE INDEX "DailyLeadershipCounter_userId_date_idx" ON "DailyLeadershipCounter"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLeadershipCounter_userId_date_key" ON "DailyLeadershipCounter"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cashfreeOrderId_key" ON "Order"("cashfreeOrderId");

-- AddForeignKey
ALTER TABLE "RankChange" ADD CONSTRAINT "RankChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLeadershipCounter" ADD CONSTRAINT "DailyLeadershipCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
