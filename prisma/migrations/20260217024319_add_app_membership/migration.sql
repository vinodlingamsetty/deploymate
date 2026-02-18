-- CreateTable
CREATE TABLE "AppMembership" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppMembership_appId_idx" ON "AppMembership"("appId");

-- CreateIndex
CREATE INDEX "AppMembership_userId_idx" ON "AppMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppMembership_appId_userId_key" ON "AppMembership"("appId", "userId");

-- AddForeignKey
ALTER TABLE "AppMembership" ADD CONSTRAINT "AppMembership_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMembership" ADD CONSTRAINT "AppMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
