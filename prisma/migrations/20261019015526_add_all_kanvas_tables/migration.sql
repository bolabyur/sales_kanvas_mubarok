-- CreateTable
CREATE TABLE "gudang" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "nama_gudang" TEXT NOT NULL,
    "tipe_gudang" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gudang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipe_harga" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "nama_tipe" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipe_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlet" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "nama_toko" TEXT NOT NULL,
    "alamat" TEXT,
    "tipe_harga_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_harga" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "tipe_harga_id" INTEGER NOT NULL,
    "harga" DECIMAL(15,2) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "no_batch" TEXT NOT NULL,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "stok_gudang" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rencana_kanvas_outlet" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "urutan_kunjungan" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rencana_kanvas_outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kasbon_operasional" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "nominal_kasbon" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kasbon_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_kasbon_operasional" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kasbon_operasional_id" INTEGER NOT NULL,
    "nama_pengeluaran" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "foto_bukti" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_kasbon_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kasbon_produk" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kasbon_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_kasbon_produk" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kasbon_produk_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "qty_bawa" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_kasbon_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_out" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kasbon_produk_id" INTEGER NOT NULL,
    "gudang_id" INTEGER NOT NULL,
    "tgl_keluar" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_out_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_produk_out" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "produk_out_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_produk_out_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_outlet" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "tipe_pembayaran" TEXT NOT NULL,
    "total_tagihan" DECIMAL(15,2) NOT NULL,
    "tgl_invoice" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_invoice_outlet" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_outlet_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "tipe_baris" TEXT NOT NULL DEFAULT 'Penjualan',
    "qty" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_invoice_outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_retur_produk" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "outlet_id" INTEGER NOT NULL,
    "invoice_outlet_id" INTEGER,
    "gudang_retur_id" INTEGER NOT NULL,
    "total_nilai_retur" DECIMAL(15,2) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_retur_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_invoice_retur_produk" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_retur_produk_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "alasan_retur" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_invoice_retur_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kartu_piutang_outlet" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_outlet_id" INTEGER NOT NULL,
    "sisa_piutang" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "jatuh_tempo" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kartu_piutang_outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran_invoice" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_outlet_id" INTEGER NOT NULL,
    "nominal_bayar" DECIMAL(15,2) NOT NULL,
    "tipe_bayar" TEXT NOT NULL,
    "tgl_bayar" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alokasi_retur_piutang" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_retur_produk_id" INTEGER NOT NULL,
    "kartu_piutang_outlet_id" INTEGER NOT NULL,
    "nominal_potongan" DECIMAL(15,2) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alokasi_retur_piutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_in" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "gudang_id" INTEGER NOT NULL,
    "tgl_masuk" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_produk_in" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "produk_in_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "qty_sisa" INTEGER NOT NULL,
    "kondisi" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_produk_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_batch" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "tipe_mutasi" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutasi_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "total_penjualan_tunai" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_piutang_baru" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_kasbon_realisasi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selisih_kas" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "approved_by" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gudang_uuid_key" ON "gudang"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tipe_harga_uuid_key" ON "tipe_harga"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "outlet_uuid_key" ON "outlet"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_harga_uuid_key" ON "produk_harga"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_harga_produk_id_tipe_harga_id_key" ON "produk_harga"("produk_id", "tipe_harga_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_uuid_key" ON "batch"("uuid");

-- CreateIndex
CREATE INDEX "batch_expired_date_idx" ON "batch"("expired_date");

-- CreateIndex
CREATE UNIQUE INDEX "batch_produk_id_no_batch_key" ON "batch"("produk_id", "no_batch");

-- CreateIndex
CREATE UNIQUE INDEX "rencana_kanvas_outlet_uuid_key" ON "rencana_kanvas_outlet"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "kasbon_operasional_uuid_key" ON "kasbon_operasional"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "detail_kasbon_operasional_uuid_key" ON "detail_kasbon_operasional"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "kasbon_produk_uuid_key" ON "kasbon_produk"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "detail_kasbon_produk_uuid_key" ON "detail_kasbon_produk"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_out_uuid_key" ON "produk_out"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "detail_produk_out_uuid_key" ON "detail_produk_out"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_outlet_uuid_key" ON "invoice_outlet"("uuid");

-- CreateIndex
CREATE INDEX "invoice_outlet_outlet_id_idx" ON "invoice_outlet"("outlet_id");

-- CreateIndex
CREATE INDEX "invoice_outlet_tgl_invoice_idx" ON "invoice_outlet"("tgl_invoice");

-- CreateIndex
CREATE UNIQUE INDEX "detail_invoice_outlet_uuid_key" ON "detail_invoice_outlet"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_retur_produk_uuid_key" ON "invoice_retur_produk"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "detail_invoice_retur_produk_uuid_key" ON "detail_invoice_retur_produk"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "kartu_piutang_outlet_uuid_key" ON "kartu_piutang_outlet"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "kartu_piutang_outlet_invoice_outlet_id_key" ON "kartu_piutang_outlet"("invoice_outlet_id");

-- CreateIndex
CREATE INDEX "kartu_piutang_outlet_sisa_piutang_idx" ON "kartu_piutang_outlet"("sisa_piutang");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_invoice_uuid_key" ON "pembayaran_invoice"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "alokasi_retur_piutang_uuid_key" ON "alokasi_retur_piutang"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produk_in_uuid_key" ON "produk_in"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "detail_produk_in_uuid_key" ON "detail_produk_in"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "mutasi_batch_uuid_key" ON "mutasi_batch"("uuid");

-- CreateIndex
CREATE INDEX "mutasi_batch_batch_id_idx" ON "mutasi_batch"("batch_id");

-- CreateIndex
CREATE INDEX "mutasi_batch_created_at_idx" ON "mutasi_batch"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_uuid_key" ON "settlement"("uuid");

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_tipe_harga_id_fkey" FOREIGN KEY ("tipe_harga_id") REFERENCES "tipe_harga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_harga" ADD CONSTRAINT "produk_harga_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_harga" ADD CONSTRAINT "produk_harga_tipe_harga_id_fkey" FOREIGN KEY ("tipe_harga_id") REFERENCES "tipe_harga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rencana_kanvas_outlet" ADD CONSTRAINT "rencana_kanvas_outlet_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rencana_kanvas_outlet" ADD CONSTRAINT "rencana_kanvas_outlet_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kasbon_operasional" ADD CONSTRAINT "kasbon_operasional_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_kasbon_operasional" ADD CONSTRAINT "detail_kasbon_operasional_kasbon_operasional_id_fkey" FOREIGN KEY ("kasbon_operasional_id") REFERENCES "kasbon_operasional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kasbon_produk" ADD CONSTRAINT "kasbon_produk_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_kasbon_produk" ADD CONSTRAINT "detail_kasbon_produk_kasbon_produk_id_fkey" FOREIGN KEY ("kasbon_produk_id") REFERENCES "kasbon_produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_kasbon_produk" ADD CONSTRAINT "detail_kasbon_produk_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_kasbon_produk" ADD CONSTRAINT "detail_kasbon_produk_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_out" ADD CONSTRAINT "produk_out_kasbon_produk_id_fkey" FOREIGN KEY ("kasbon_produk_id") REFERENCES "kasbon_produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_out" ADD CONSTRAINT "produk_out_gudang_id_fkey" FOREIGN KEY ("gudang_id") REFERENCES "gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_out" ADD CONSTRAINT "detail_produk_out_produk_out_id_fkey" FOREIGN KEY ("produk_out_id") REFERENCES "produk_out"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_out" ADD CONSTRAINT "detail_produk_out_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_out" ADD CONSTRAINT "detail_produk_out_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_outlet" ADD CONSTRAINT "invoice_outlet_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_outlet" ADD CONSTRAINT "invoice_outlet_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_outlet" ADD CONSTRAINT "detail_invoice_outlet_invoice_outlet_id_fkey" FOREIGN KEY ("invoice_outlet_id") REFERENCES "invoice_outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_outlet" ADD CONSTRAINT "detail_invoice_outlet_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_outlet" ADD CONSTRAINT "detail_invoice_outlet_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_retur_produk" ADD CONSTRAINT "invoice_retur_produk_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_retur_produk" ADD CONSTRAINT "invoice_retur_produk_invoice_outlet_id_fkey" FOREIGN KEY ("invoice_outlet_id") REFERENCES "invoice_outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_retur_produk" ADD CONSTRAINT "invoice_retur_produk_gudang_retur_id_fkey" FOREIGN KEY ("gudang_retur_id") REFERENCES "gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_retur_produk" ADD CONSTRAINT "detail_invoice_retur_produk_invoice_retur_produk_id_fkey" FOREIGN KEY ("invoice_retur_produk_id") REFERENCES "invoice_retur_produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_retur_produk" ADD CONSTRAINT "detail_invoice_retur_produk_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_invoice_retur_produk" ADD CONSTRAINT "detail_invoice_retur_produk_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kartu_piutang_outlet" ADD CONSTRAINT "kartu_piutang_outlet_invoice_outlet_id_fkey" FOREIGN KEY ("invoice_outlet_id") REFERENCES "invoice_outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_invoice" ADD CONSTRAINT "pembayaran_invoice_invoice_outlet_id_fkey" FOREIGN KEY ("invoice_outlet_id") REFERENCES "invoice_outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi_retur_piutang" ADD CONSTRAINT "alokasi_retur_piutang_invoice_retur_produk_id_fkey" FOREIGN KEY ("invoice_retur_produk_id") REFERENCES "invoice_retur_produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi_retur_piutang" ADD CONSTRAINT "alokasi_retur_piutang_kartu_piutang_outlet_id_fkey" FOREIGN KEY ("kartu_piutang_outlet_id") REFERENCES "kartu_piutang_outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_in" ADD CONSTRAINT "produk_in_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_in" ADD CONSTRAINT "produk_in_gudang_id_fkey" FOREIGN KEY ("gudang_id") REFERENCES "gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_in" ADD CONSTRAINT "detail_produk_in_produk_in_id_fkey" FOREIGN KEY ("produk_in_id") REFERENCES "produk_in"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_in" ADD CONSTRAINT "detail_produk_in_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_produk_in" ADD CONSTRAINT "detail_produk_in_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_batch" ADD CONSTRAINT "mutasi_batch_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "ms_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
