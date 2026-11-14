-- AlterTable
ALTER TABLE "produk_in" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produk_in_document_number_key" ON "produk_in"("document_number");