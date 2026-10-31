export type KasbonProdukStatus = 'DRAFT' | 'ONLOADING' | 'BATAL' | 'PENDING';

export type KasbonProduk = {
  id: number;
  sales_kanvas_plan_id: number;
  status: KasbonProdukStatus;
  salesKanvasPlan?: { invoice: string };
  detailKasbonProduks?: any[];
};

export type DetailKasbonProdukPayload = {
  produk_id: number;
  qty_bawa: number;
};

export type KasbonProdukPayload = {
  sales_kanvas_plan_id: number;
  details: DetailKasbonProdukPayload[];
  operasional?: Array<{
    nama_pengeluaran: string;
    nominal: number;
    foto_bukti: string;
  }>;
};