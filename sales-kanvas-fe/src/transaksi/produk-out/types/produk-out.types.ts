export type TipeSumberOut = "TOKO" | "SALES_COUNTER" | "SALES_KANVAS";

export type ProdukOut = {
  id: number;
  uuid: string;
  kasbon_produk_id: number;
  gudang_id: number;
  tgl_keluar: string;
  source_type: TipeSumberOut | null; 
  is_deleted: boolean;
  sync_status: string;
  updated_at: string;
  kasbonProduk?: any;
  detailProdukOuts?: any[];
};

export type ProdukOutPayload = {
  kasbon_produk_id: number;
  gudang_id: number;
  tgl_keluar: string;
  source_type: TipeSumberOut;
};