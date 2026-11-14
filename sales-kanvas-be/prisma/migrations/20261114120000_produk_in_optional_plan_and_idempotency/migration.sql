-- AlterTable
ALTER TABLE "produk_in" 
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "payload_hash" TEXT,
ALTER COLUMN "sales_kanvas_plan_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "produk_in_idempotency_key_key" ON "produk_in"("idempotency_key");
