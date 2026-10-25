export type TipeSumberOut = "KE_SALES_KANVAS" | "KE_PENJUALAN" | "KE_SALES_COUNTER" | "KE_SHOWROOM";

export type ProdukOut = {
  id: number;
  uuid: string;
  kasbon_produk_id: number;
  gudang_id: number;
  tgl_keluar: string;
  tipe_sumber: TipeSumberOut;
  created_at: string;
  kasbonProduk?: any;
  detailProdukOuts?: any[];
};

export type ProdukOutPayload = {
  kasbon_produk_id: number;
  gudang_id: number;
  tgl_keluar: string;
  tipe_sumber: TipeSumberOut;
};