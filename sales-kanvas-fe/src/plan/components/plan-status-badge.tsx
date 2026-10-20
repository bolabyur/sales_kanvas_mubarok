import { Badge } from "@/components/ui/badge";
import type { PlanStatus } from "../types/plan.types";

export const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  DISETUJUI: "Disetujui",
  LOADING: "Loading",
  KOMPLIT: "Komplit",
  BATAL: "Batal",
  REVISI: "Revisi",
};

const VARIANT = {
  DRAFT: "secondary",
  DISETUJUI: "default",
  LOADING: "outline",
  KOMPLIT: "default",
  BATAL: "destructive",
  REVISI: "outline",
} as const satisfies Record<PlanStatus, string>;

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
