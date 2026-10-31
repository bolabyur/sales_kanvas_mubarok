/*
  Warnings:

  - A unique constraint covering the columns `[sales_kanvas_plan_id]` on the table `kasbon_produk` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "kasbon_produk_sales_kanvas_plan_id_key" ON "kasbon_produk"("sales_kanvas_plan_id");
