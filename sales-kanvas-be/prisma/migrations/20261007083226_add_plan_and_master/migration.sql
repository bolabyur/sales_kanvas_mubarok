-- CreateTable
CREATE TABLE "ms_vehicle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type_vehicle" TEXT NOT NULL,
    "nopol" TEXT NOT NULL,
    "type_fuel" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ms_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ms_market_area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ms_market_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ms_product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "product_brand_id" INTEGER NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "jenang_flavor_id" INTEGER,
    "isian" INTEGER,
    "unit_id" INTEGER,
    "sale_report_group_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "weight" INTEGER,
    "is_active" BOOLEAN NOT NULL,
    "barcode" TEXT NOT NULL,
    "type_price" TEXT NOT NULL,
    "hpp" DECIMAL(12,2),
    "expired_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ms_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ms_employee" (
    "id" SERIAL NOT NULL,
    "avatar_file_id" INTEGER,
    "name" TEXT NOT NULL,
    "nip" TEXT,
    "pin_fingerprint" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "tipe_upah_id" INTEGER,
    "employee_position_id" INTEGER NOT NULL,
    "employee_job_id" INTEGER NOT NULL,
    "employee_contract_id" INTEGER NOT NULL,
    "devisi_id" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "agama" TEXT NOT NULL,
    "tgl_lahir" TIMESTAMP(3) NOT NULL,
    "tgl_masuk" TIMESTAMP(3) NOT NULL,
    "hari_libur_mingguan" INTEGER,
    "jam_kerja_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ms_employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ms_kanvas_kasbon_material_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ms_kanvas_kasbon_material_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ts_sales_kanvas_plan" (
    "id" SERIAL NOT NULL,
    "invoice" TEXT NOT NULL,
    "tgl_invoice" TIMESTAMP(3) NOT NULL,
    "tgl_pergi_kanvas" TIMESTAMP(3) NOT NULL,
    "tgl_kembali_kanvas" TIMESTAMP(3),
    "market_area_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "revisi_to" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ts_sales_kanvas_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ts_sales_kanvas_plan_detail" (
    "id" SERIAL NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ts_sales_kanvas_plan_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ts_sales_kanvas_personil" (
    "id" SERIAL NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ts_sales_kanvas_personil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ts_sales_kanvas_kasbon_material" (
    "id" SERIAL NOT NULL,
    "sales_kanvas_plan_id" INTEGER NOT NULL,
    "kasbon_material_type_id" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ts_sales_kanvas_kasbon_material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ms_vehicle_nopol_key" ON "ms_vehicle"("nopol");

-- CreateIndex
CREATE UNIQUE INDEX "ms_market_area_name_key" ON "ms_market_area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_product_name_key" ON "ms_product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_product_code_key" ON "ms_product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ms_product_barcode_key" ON "ms_product"("barcode");

-- CreateIndex
CREATE INDEX "ms_product_is_active_idx" ON "ms_product"("is_active");

-- CreateIndex
CREATE INDEX "ms_product_product_brand_id_idx" ON "ms_product"("product_brand_id");

-- CreateIndex
CREATE INDEX "ms_product_product_type_id_idx" ON "ms_product"("product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_employee_nip_key" ON "ms_employee"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "ms_employee_pin_fingerprint_key" ON "ms_employee"("pin_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ms_employee_contact_key" ON "ms_employee"("contact");

-- CreateIndex
CREATE INDEX "ms_employee_is_active_idx" ON "ms_employee"("is_active");

-- CreateIndex
CREATE INDEX "ms_employee_employee_position_id_idx" ON "ms_employee"("employee_position_id");

-- CreateIndex
CREATE INDEX "ms_employee_employee_job_id_idx" ON "ms_employee"("employee_job_id");

-- CreateIndex
CREATE INDEX "ms_employee_employee_contract_id_idx" ON "ms_employee"("employee_contract_id");

-- CreateIndex
CREATE INDEX "ms_employee_tipe_upah_id_idx" ON "ms_employee"("tipe_upah_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_kanvas_kasbon_material_type_name_key" ON "ms_kanvas_kasbon_material_type"("name");

-- CreateIndex
CREATE INDEX "ts_sales_kanvas_plan_invoice_idx" ON "ts_sales_kanvas_plan"("invoice");

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_plan" ADD CONSTRAINT "ts_sales_kanvas_plan_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "ms_vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_plan" ADD CONSTRAINT "ts_sales_kanvas_plan_market_area_id_fkey" FOREIGN KEY ("market_area_id") REFERENCES "ms_market_area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_plan_detail" ADD CONSTRAINT "ts_sales_kanvas_plan_detail_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_plan_detail" ADD CONSTRAINT "ts_sales_kanvas_plan_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ms_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_personil" ADD CONSTRAINT "ts_sales_kanvas_personil_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_personil" ADD CONSTRAINT "ts_sales_kanvas_personil_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "ms_employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_kasbon_material" ADD CONSTRAINT "ts_sales_kanvas_kasbon_material_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts_sales_kanvas_kasbon_material" ADD CONSTRAINT "ts_sales_kanvas_kasbon_material_kasbon_material_type_id_fkey" FOREIGN KEY ("kasbon_material_type_id") REFERENCES "ms_kanvas_kasbon_material_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
