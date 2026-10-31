export type DetailReturPayload = {
  batch_id: number;
  produk_id: number;
  qty: number;
  alasan_retur: string;
};

export type ReturPayload = {
  outlet_id: number;
  invoice_outlet_id?: number | null;
  gudang_retur_id: number;
  total_nilai_retur: number;
  details: DetailReturPayload[];
};

export type Retur = {
  id: number;
  outlet_id: number;
  invoice_outlet_id: number | null;
  gudang_retur_id: number;
  total_nilai_retur: string;
  status: string; // <-- PERBAIKAN: Tambahkan ini untuk menghilangkan error merah
  is_deleted: boolean; // Opsional, untuk soft delete
  created_at: string;
  updated_at: string;
  outlet?: any;
  invoiceOutlet?: any;
  gudangRetur?: any;
  detailInvoiceReturs?: any[];
};