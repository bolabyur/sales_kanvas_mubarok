export type KasbonProdukStatus = "PENDING" | "APPROVED" | "BATAL";

export type KasbonProduk = {
  id: number;
  sales_kanvas_plan_id: number;
  status: KasbonProdukStatus;
  salesKanvasPlan?: { invoice: string };
  detailKasbonProduks?: any[];
};

export type KasbonProdukPayload = {
  sales_kanvas_plan_id: number;
  details: {
    produk_id: number;
    batch_id: number;
    qty_bawa: number;
  }[];
};