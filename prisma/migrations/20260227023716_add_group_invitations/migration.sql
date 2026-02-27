-- CreateTable
CREATE TABLE "GroupInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'TESTER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "appGroupId" TEXT,
    "orgGroupId" TEXT,
    "invitedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "GroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_token_key" ON "GroupInvitation"("token");

-- CreateIndex
CREATE INDEX "GroupInvitation_token_idx" ON "GroupInvitation"("token");

-- CreateIndex
CREATE INDEX "GroupInvitation_email_idx" ON "GroupInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_appGroupId_email_key" ON "GroupInvitation"("appGroupId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_orgGroupId_email_key" ON "GroupInvitation"("orgGroupId", "email");

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_appGroupId_fkey" FOREIGN KEY ("appGroupId") REFERENCES "AppDistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_orgGroupId_fkey" FOREIGN KEY ("orgGroupId") REFERENCES "OrgDistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
