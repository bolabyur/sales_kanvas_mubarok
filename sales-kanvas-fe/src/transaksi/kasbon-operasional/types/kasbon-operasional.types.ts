export type KasbonOperasional = {
  id: number;
  sales_kanvas_plan_id: number;
  nominal_kasbon: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  salesKanvasPlan?: any;
  detailKasbonOperasional?: any[];
  updated_at: string;
};