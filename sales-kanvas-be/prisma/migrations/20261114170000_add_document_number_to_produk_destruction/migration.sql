-- AlterTable
ALTER TABLE "produk_destruction" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produk_destruction_document_number_key" ON "produk_destruction"("document_number");