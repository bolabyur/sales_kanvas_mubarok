export type PlanStatus = "DRAFT" | "DISETUJUI" | "BATAL" | "KOMPLIT";

export type Plan = {
  id: number;
  invoice: string;
  tgl_invoice: string;
  tgl_pergi_kanvas: string;
  tgl_kembali_kanvas: string | null;
  status: PlanStatus;
  note: string | null;
  marketArea?: { name: string };
  vehicle?: { nopol: string; name: string };
  salesKanvasPersonil: any[];
  salesKanvasPlanDetail: any[];
};

export type PlanPayload = {
  tgl_invoice: string;
  tgl_pergi_kanvas: string;
  tgl_kembali_kanvas: string | null;
  market_area_id: number;
  vehicle_id: number;
  note: string | null;
  salesKanvasPersonil: { employee_id: number; position: string }[];
  salesKanvasPlanDetail: { product_id: number; qty: number }[];
};

export type PlanListResponse = {
  items: Plan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};