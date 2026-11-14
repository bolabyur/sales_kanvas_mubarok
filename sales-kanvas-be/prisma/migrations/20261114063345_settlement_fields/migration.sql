/*
  Warnings:

  - A unique constraint covering the columns `[document_number]` on the table `settlement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `settlement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "settlement" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT,
ADD COLUMN     "tgl_settlement" TIMESTAMP(3),
ADD COLUMN     "uang_fisik_diterima" DECIMAL(15,2),
ADD COLUMN     "user_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "settlement_document_number_key" ON "settlement"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_idempotency_key_key" ON "settlement"("idempotency_key");
