-- AlterTable
ALTER TABLE "pembayaran_invoice" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_invoice_document_number_key" ON "pembayaran_invoice"("document_number");