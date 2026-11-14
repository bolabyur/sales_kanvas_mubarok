-- DropForeignKey
ALTER TABLE "produk_in" DROP CONSTRAINT "produk_in_sales_kanvas_plan_id_fkey";

-- AddForeignKey
ALTER TABLE "produk_in" ADD CONSTRAINT "produk_in_sales_kanvas_plan_id_fkey" FOREIGN KEY ("sales_kanvas_plan_id") REFERENCES "ts_sales_kanvas_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
