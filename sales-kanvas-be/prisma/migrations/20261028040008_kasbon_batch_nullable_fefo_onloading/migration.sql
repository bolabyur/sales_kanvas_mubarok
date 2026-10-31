-- DropForeignKey
ALTER TABLE "detail_kasbon_produk" DROP CONSTRAINT "detail_kasbon_produk_batch_id_fkey";

-- AlterTable
ALTER TABLE "detail_kasbon_produk" ALTER COLUMN "batch_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "kasbon_operasional" ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "kasbon_produk" ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "produk_in" ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "source_type" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "produk_out" ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "source_type" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "kanvas_return" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "gudang_tujuan_id" INTEGER NOT NULL,
    "tgl_retur" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanvas_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanvas_return_detail" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kanvas_return_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "kondisi" TEXT NOT NULL,
    "alasan" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanvas_return_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_destruction" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "gudang_id" INTEGER NOT NULL,
    "tgl_destruction" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "alasan" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_destruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_destruction_detail" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "produk_destruction_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "qty_dimusnahkan" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_destruction_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_record" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "status_code" INTEGER NOT NULL DEFAULT 201,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kanvas_return_uuid_key" ON "kanvas_return"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "kanvas_return_detail_uuid_key" ON "kanvas_return_detail"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_destruction_uuid_key" ON "produk_destruction"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_destruction_detail_uuid_key" ON "produk_destruction_detail"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_record_key_key" ON "idempotency_record"("key");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "detail_kasbon_produk" ADD CONSTRAINT "detail_kasbon_produk_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanvas_return" ADD CONSTRAINT "kanvas_return_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanvas_return" ADD CONSTRAINT "kanvas_return_gudang_tujuan_id_fkey" FOREIGN KEY ("gudang_tujuan_id") REFERENCES "gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanvas_return_detail" ADD CONSTRAINT "kanvas_return_detail_kanvas_return_id_fkey" FOREIGN KEY ("kanvas_return_id") REFERENCES "kanvas_return"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanvas_return_detail" ADD CONSTRAINT "kanvas_return_detail_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanvas_return_detail" ADD CONSTRAINT "kanvas_return_detail_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_destruction" ADD CONSTRAINT "produk_destruction_gudang_id_fkey" FOREIGN KEY ("gudang_id") REFERENCES "gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_destruction_detail" ADD CONSTRAINT "produk_destruction_detail_produk_destruction_id_fkey" FOREIGN KEY ("produk_destruction_id") REFERENCES "produk_destruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_destruction_detail" ADD CONSTRAINT "produk_destruction_detail_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_destruction_detail" ADD CONSTRAINT "produk_destruction_detail_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
