import type { Employee } from "@/master/employee/types/employee.types";
import type { KasbonMaterialType } from "@/master/kasbon-material-type/types/kasbonMaterialType.types";
import type { MarketArea } from "@/master/market-area/types/marketArea.types";
import type { Product } from "@/master/product/types/product.types";
import type { Vehicle } from "@/master/vehicle/types/vehicle.types";

export const PLAN_STATUSES = [
  "DRAFT",
  "DISETUJUI",
  "LOADING",
  "KOMPLIT",
  "BATAL",
  "REVISI",
] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export type PlanPersonil = {
  id: number;
  employee_id: number;
  position: string;
  employee: Employee;
};

export type PlanDetail = {
  id: number;
  product_id: number;
  qty: number;
  product: Product;
};

export type PlanKasbon = {
  id: number;
  kasbon_material_type_id: number;
  price: string;
  qty: number;
  kasbonMaterialType: KasbonMaterialType;
};

export type Plan = {
  id: number;
  invoice: string;
  tgl_invoice: string;
  tgl_pergi_kanvas: string;
  tgl_kembali_kanvas: string | null;
  market_area_id: number;
  vehicle_id: number;
  status: PlanStatus;
  note: string | null;
  revision: number;
  revisi_to: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string | null;
  vehicle: Vehicle;
  marketArea: MarketArea;
  salesKanvasPersonil: PlanPersonil[];
  salesKanvasPlanDetail: PlanDetail[];
  salesKanvasKasbonMaterial: PlanKasbon[];
};

export type PlanPayload = {
  tgl_invoice: string;
  tgl_pergi_kanvas: string;
  tgl_kembali_kanvas: string | null;
  market_area_id: number;
  vehicle_id: number;
  note: string | null;
  salesKanvasPlanPersonil: { employee_id: number; position: string }[];
  salesKanvasPlanDetail: { product_id: number; qty: number }[];
  salesKanvasKasbonMaterial: {
    kasbon_material_type_id: number;
    price: number;
    qty: number;
  }[];
};

export type PlanListQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  market_area_id?: number;
  tanggalPergiKanvasStart?: string;
  tanggalPergiKanvasEnd?: string;
};

export type PlanList = {
  items: Plan[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
