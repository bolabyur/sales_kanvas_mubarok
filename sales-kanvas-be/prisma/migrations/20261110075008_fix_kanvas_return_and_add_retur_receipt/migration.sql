-- AlterTable
ALTER TABLE "kanvas_return" ALTER COLUMN "payload_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "retur_receipt" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kanvas_return_id" INTEGER NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retur_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retur_receipt_uuid_key" ON "retur_receipt"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "retur_receipt_idempotency_key_key" ON "retur_receipt"("idempotency_key");

-- AddForeignKey
ALTER TABLE "retur_receipt" ADD CONSTRAINT "retur_receipt_kanvas_return_id_fkey" FOREIGN KEY ("kanvas_return_id") REFERENCES "kanvas_return"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
