-- AlterTable
ALTER TABLE "Release" ADD COLUMN     "provisioningExpiry" TIMESTAMP(3),
ADD COLUMN     "provisioningName" TEXT,
ADD COLUMN     "signingType" TEXT,
ADD COLUMN     "teamName" TEXT;
