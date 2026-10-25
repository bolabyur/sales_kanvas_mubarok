export type TipeSumberIn = "DARI_PRODUKSI" | "DARI_SALES_KANVAS" | "DARI_RETUR" | "DARI_SHOWROOM";

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
  tipe_sumber: TipeSumberIn;
  details: DetailProdukInPayload[];
};

export type ProdukIn = {
  id: number;
  uuid: string;
  sales_kanvas_plan_id: number;
  gudang_id: number;
  tgl_masuk: string;
  tipe_sumber: TipeSumberIn;
  salesKanvasPlan?: any;
  detailProdukIns?: any[];
};