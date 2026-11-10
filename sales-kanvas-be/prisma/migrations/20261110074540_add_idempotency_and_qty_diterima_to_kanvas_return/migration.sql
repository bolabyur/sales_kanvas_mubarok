/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `kanvas_return` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payload_hash` to the `kanvas_return` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "kanvas_return" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "payload_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "kanvas_return_idempotency_key_key" ON "kanvas_return"("idempotency_key");
