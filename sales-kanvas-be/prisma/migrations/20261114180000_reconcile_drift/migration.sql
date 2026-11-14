-- ============================================================
-- Reconciliation: align migration history with actual DB schema
-- Idempotent — safe for both existing and fresh DB
-- ============================================================

-- Drift #1: kasbon_produk.document_number + unique index
ALTER TABLE "kasbon_produk" ADD COLUMN IF NOT EXISTS "document_number" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'kasbon_produk'
      AND indexname = 'kasbon_produk_document_number_key'
  ) THEN
    CREATE UNIQUE INDEX "kasbon_produk_document_number_key"
      ON "kasbon_produk"("document_number");
  END IF;
END $$;

-- Drift #2: ts_sales_kanvas_plan.invoice unique index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'ts_sales_kanvas_plan'
      AND indexname = 'ts_sales_kanvas_plan_invoice_key'
  ) THEN
    CREATE UNIQUE INDEX "ts_sales_kanvas_plan_invoice_key"
      ON "ts_sales_kanvas_plan"("invoice");
  END IF;
END $$;