-- AlterTable
ALTER TABLE "kanvas_return" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "kanvas_return_document_number_key" ON "kanvas_return"("document_number");