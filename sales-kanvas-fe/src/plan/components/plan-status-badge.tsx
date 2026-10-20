import { Badge } from "@/components/ui/badge";
import type { PlanStatus } from "../types/plan.types";

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  DISETUJUI: "Disetujui",
  APPROVED: "Disetujui", 
  LOADING: "Loading",
  ON_TRIP: "On-Trip",    
  KOMPLIT: "Komplit",
  SETTLED: "Settled",
  BATAL: "Batal",
  REVISI: "Revisi",
};

const VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  DISETUJUI: "default",
  APPROVED: "default",
  LOADING: "outline",
  ON_TRIP: "outline",
  KOMPLIT: "default",
  SETTLED: "default",
  BATAL: "destructive",
  REVISI: "outline",
};

export function PlanStatusBadge({ status }: { status: PlanStatus | string }) {
  const normalized = String(status || "").toUpperCase().replace(/-/g, "_");
  
  const label = STATUS_LABEL[normalized] || status || "Unknown";
  const variant = VARIANT[normalized] || "outline";

  return <Badge variant={variant}>{label}</Badge>;
}