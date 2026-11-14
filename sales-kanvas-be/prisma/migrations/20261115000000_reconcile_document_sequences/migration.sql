-- ============================================================
-- Reconcile document_sequence with existing document_number data
-- SAFE: only INCREASES last_number (GREATEST). Never decreases.
-- Never touches existing document rows. Never deletes anything.
-- ============================================================

WITH all_existing AS (
  SELECT 'INV' AS prefix, document_number FROM invoice_outlet WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'KW', document_number FROM pembayaran_invoice WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'RTS', document_number FROM kanvas_return WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'BON', document_number FROM kasbon_produk WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'DSP', document_number FROM produk_destruction WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'ULD', document_number FROM produk_in WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'LDG', document_number FROM produk_out WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'STL', document_number FROM settlement WHERE document_number IS NOT NULL
  UNION ALL
  SELECT 'PLN', invoice AS document_number FROM ts_sales_kanvas_plan WHERE invoice ~ '^PLN-[0-9]{6}-[0-9]+$'
),
parsed AS (
  SELECT
    prefix,
    SUBSTRING(document_number FROM '^[A-Z]+-([0-9]{6})-') AS date_key,
    CAST(SUBSTRING(document_number FROM '-([0-9]+)$') AS INTEGER) AS num
  FROM all_existing
  WHERE document_number ~ '^[A-Z]+-[0-9]{6}-[0-9]+$'
)
INSERT INTO document_sequence (prefix, date_key, last_number)
SELECT prefix, date_key, MAX(num)
FROM parsed
GROUP BY prefix, date_key
ON CONFLICT (prefix, date_key)
DO UPDATE SET last_number = GREATEST(document_sequence.last_number, EXCLUDED.last_number);