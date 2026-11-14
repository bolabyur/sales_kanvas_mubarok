-- Partial unique index: one ACTIVE settlement per plan
-- Excludes soft-deleted settlements (is_deleted = false)
-- Prisma cannot express partial unique index in schema; applied via custom SQL.

CREATE UNIQUE INDEX "settlement_sales_kanvas_plan_id_active_key"
  ON "settlement"("sales_kanvas_plan_id")
  WHERE "is_deleted" = false;