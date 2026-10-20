export type TypePrice = "FIXED" | "PERSENTASE";

export type Product = {
  id: number;
  name: string;
  code: string;
  product_brand_id: number;
  product_type_id: number;
  jenang_flavor_id: number | null;
  isian: number | null;
  unit_id: number | null;
  sale_report_group_id: number;
  supplier_id: number;
  weight: number | null;
  is_active: boolean;
  barcode: string;
  type_price: TypePrice;
  hpp: string | null;
  expired_count: number | null;
  created_at: string;
  updated_at: string | null;
  user_id: number;
  ip: string;
};

export type ProductPayload = {
  name: string;
  code: string;
  product_brand_id: number;
  product_type_id: number;
  jenang_flavor_id: number | null;
  isian: number | null;
  unit_id: number | null;
  sale_report_group_id: number;
  supplier_id: number;
  weight: number | null;
  is_active: boolean;
  barcode: string;
  type_price: TypePrice;
  hpp: number | null;
  expired_count: number | null;
};

export type ProductWithPrices = ProductPayload & {
  id?: number;
  prices: { tipe_harga_id: number; harga: number }[];
};