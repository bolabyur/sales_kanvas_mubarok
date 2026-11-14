-- AlterTable
ALTER TABLE "invoice_outlet" ADD COLUMN "document_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoice_outlet_document_number_key" ON "invoice_outlet"("document_number");
