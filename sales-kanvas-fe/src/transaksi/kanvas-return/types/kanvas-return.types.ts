export type DetailKanvasReturnPayload = {
  batch_id: number;
  produk_id: number;
  qty: number;
  kondisi: "BAGUS" | "RUSAK" | "EXPIRED";
  alasan?: string;
};

export type KanvasReturnPayload = {
  sales_kanvas_plan_id: number;
  gudang_tujuan_id: number;
  tgl_retur: string;
  details: DetailKanvasReturnPayload[];
};

export type KanvasReturn = {
  id: number;
  sales_kanvas_plan_id: number;
  gudang_tujuan_id: number;
  tgl_retur: string;
  status: string;
  salesKanvasPlan?: any;
  gudangTujuan?: any;
  details?: any[];
};