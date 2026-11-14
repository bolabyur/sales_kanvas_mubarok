-- AlterTable
ALTER TABLE "produk_out" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produk_out_document_number_key" ON "produk_out"("document_number");
