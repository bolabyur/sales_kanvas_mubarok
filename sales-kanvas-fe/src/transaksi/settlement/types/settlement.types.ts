export type SettlementPayload = {
  sales_kanvas_plan_id: number;
  total_penjualan_tunai: number;
  total_piutang_baru: number;
  total_kasbon_realisasi: number;
  uang_fisik_diterima: number;
  status: string;
};

export type Settlement = {
  id: number;
  sales_kanvas_plan_id: number;
  total_penjualan_tunai: string;
  total_piutang_baru: string;
  total_kasbon_realisasi: string;
  selisih_kas: string;
  status: string;
  salesKanvasPlan?: any;
};