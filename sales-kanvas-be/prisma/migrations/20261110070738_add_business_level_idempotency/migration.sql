/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `invoice_outlet` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `produk_out` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotency_key]` on the table `invoice_outlet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `kasbon_operasional` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `kasbon_produk` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `pembayaran_invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `produk_out` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invoice_outlet" DROP COLUMN "is_deleted",
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "invoice_retur_produk" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "kasbon_operasional" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT;

-- AlterTable
ALTER TABLE "kasbon_produk" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT;

-- AlterTable
ALTER TABLE "pembayaran_invoice" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT;

-- AlterTable
ALTER TABLE "produk_out" DROP COLUMN "is_deleted",
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "actor_id" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_outlet_idempotency_key_key" ON "invoice_outlet"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "kasbon_operasional_idempotency_key_key" ON "kasbon_operasional"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "kasbon_produk_idempotency_key_key" ON "kasbon_produk"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_invoice_idempotency_key_key" ON "pembayaran_invoice"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "produk_out_idempotency_key_key" ON "produk_out"("idempotency_key");
