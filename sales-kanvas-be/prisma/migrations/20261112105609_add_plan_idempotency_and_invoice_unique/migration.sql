/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `ts_sales_kanvas_plan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ts_sales_kanvas_plan" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ts_sales_kanvas_plan_idempotency_key_key" ON "ts_sales_kanvas_plan"("idempotency_key");
