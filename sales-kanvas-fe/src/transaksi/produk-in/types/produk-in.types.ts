export type TipeSumberIn = "PRODUKSI" | "SALES_KANVAS" | "TOKO" | "RETUR" | "SHOWROOM";

export type DetailProdukInPayload = {
  produk_id: number;
  no_batch: string;
  expired_date: string;
  qty_sisa: number;
  kondisi: "Bagus" | "Rusak";
};

export type ProdukInPayload = {
  sales_kanvas_plan_id: number;
  gudang_id: number;
  tgl_masuk: string;
  source_type: TipeSumberIn; 
  details: DetailProdukInPayload[];
};

export type ProdukIn = {
  id: number;
  uuid: string;
  sales_kanvas_plan_id: number;
  gudang_id: number;
  tgl_masuk: string;
  source_type: TipeSumberIn | null; 
  is_deleted: boolean;
  sync_status: string;
  updated_at: string;
  salesKanvasPlan?: any;
  detailProdukIns?: any[];
};