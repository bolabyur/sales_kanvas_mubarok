export type DetailInvoicePayload = {
  produk_id: number;
  batch_id: number;
  qty: number;
  harga_satuan: number;
};

export type InvoicePayload = {
  outlet_id: number;
  sales_kanvas_plan_id: number;
  tipe_pembayaran: "Tunai" | "Kredit";
  tgl_invoice: string;
  details: DetailInvoicePayload[];
};

export type Invoice = {
  id: number;
  outlet_id: number;
  sales_kanvas_plan_id: number;
  tipe_pembayaran: string;
  total_tagihan: string;
  tgl_invoice: string;
  outlet?: any;
  salesKanvasPlan?: any;
  detailInvoiceOutlets?: any[];
  kartuPiutangOutlet?: any;
};