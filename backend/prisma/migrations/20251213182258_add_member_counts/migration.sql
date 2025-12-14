-- AlterTable
ALTER TABLE "PairPayoutRecord" ADD COLUMN     "matchType" TEXT,
ADD COLUMN     "membersConsumed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "leftCarryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leftMemberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rightCarryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rightMemberCount" INTEGER NOT NULL DEFAULT 0;
