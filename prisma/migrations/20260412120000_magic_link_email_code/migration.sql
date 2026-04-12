-- AlterTable
ALTER TABLE "MagicLink" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE INDEX "MagicLink_email_code_idx" ON "MagicLink"("email", "code");
