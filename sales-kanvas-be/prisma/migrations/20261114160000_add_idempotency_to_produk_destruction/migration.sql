-- AlterTable
ALTER TABLE "produk_destruction" 
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "payload_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produk_destruction_idempotency_key_key" ON "produk_destruction"("idempotency_key");