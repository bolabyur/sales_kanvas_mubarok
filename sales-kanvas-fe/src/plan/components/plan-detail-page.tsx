import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectInput } from "@/components/shared/select-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate, formatRupiah } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { usePlan, useUpdatePlanStatus } from "../hooks/usePlan";
import { PLAN_STATUSES, type Plan, type PlanStatus } from "../types/plan.types";
import { PlanStatusBadge, STATUS_LABEL } from "./plan-status-badge";

export function PlanDetailPage() {
  const planId = Number(useParams().id);
  const { data: plan, isLoading, isError } = usePlan(planId);
  const canWrite = usePermission()("plan:write");

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (isError || !plan)
    return (
      <p className="text-sm text-muted-foreground">Plan tidak ditemukan.</p>
    );

  const editable = canWrite && plan.status !== "BATAL";
  const kasbonTotal = plan.salesKanvasKasbonMaterial.reduce(
    (sum, k) => sum + Number(k.price) * k.qty,
    0,
  );

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <Link
            to="/plan"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Daftar plan
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{plan.invoice}</h2>
            <PlanStatusBadge status={plan.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Revisi ke-{plan.revision}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <StatusControl plan={plan} />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={`/plan/${plan.id}/edit`} />}
            >
              <Pencil /> Revisi
            </Button>
          </div>
        )}
      </div>

      {plan.status === "BATAL" && plan.revisi_to && (
        <p className="rounded-lg border border-dashed p-3 text-sm">
          Plan ini sudah direvisi menjadi{" "}
          <Link
            to={`/plan?search=${plan.revisi_to}`}
            className="font-medium text-primary hover:underline"
          >
            {plan.revisi_to}
          </Link>
          .
        </p>
      )}

      <dl className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-3">
        <Info label="Tgl. Invoice">{formatDate(plan.tgl_invoice)}</Info>
        <Info label="Tgl. Pergi">{formatDate(plan.tgl_pergi_kanvas)}</Info>
        <Info label="Tgl. Kembali">{formatDate(plan.tgl_kembali_kanvas)}</Info>
        <Info label="Market Area">{plan.marketArea.name}</Info>
        <Info label="Kendaraan">
          {plan.vehicle.nopol} — {plan.vehicle.name}
        </Info>
        <Info label="Dibatalkan">{formatDate(plan.cancelled_at)}</Info>
        <Info label="Catatan" className="sm:col-span-3">
          {plan.note || "-"}
        </Info>
      </dl>

      <ItemsTable title="Personil" head={["Nama", "NIP", "Posisi"]}>
        {plan.salesKanvasPersonil.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.employee.name}</TableCell>
            <TableCell>{p.employee.nip ?? "-"}</TableCell>
            <TableCell>{p.position}</TableCell>
          </TableRow>
        ))}
      </ItemsTable>

      <ItemsTable title="Produk" head={["Kode", "Nama", "Qty"]}>
        {plan.salesKanvasPlanDetail.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.product.code}</TableCell>
            <TableCell>{d.product.name}</TableCell>
            <TableCell className="tabular-nums">{d.qty}</TableCell>
          </TableRow>
        ))}
      </ItemsTable>

      <ItemsTable
        title="Kasbon Material"
        head={["Jenis", "Harga", "Qty", "Subtotal"]}
        footer={
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="tabular-nums">
              {formatRupiah(kasbonTotal)}
            </TableCell>
          </TableRow>
        }
      >
        {plan.salesKanvasKasbonMaterial.map((k) => (
          <TableRow key={k.id}>
            <TableCell className="font-medium">
              {k.kasbonMaterialType.name}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatRupiah(k.price)}
            </TableCell>
            <TableCell className="tabular-nums">{k.qty}</TableCell>
            <TableCell className="tabular-nums">
              {formatRupiah(Number(k.price) * k.qty)}
            </TableCell>
          </TableRow>
        ))}
      </ItemsTable>
    </div>
  );
}

function Info({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function ItemsTable({
  title,
  head,
  footer,
  children,
}: {
  title: string;
  head: string[];
  footer?: ReactNode;
  children: ReactNode[];
}) {
  return (
    <section className="grid gap-2">
      <h3 className="font-medium">{title}</h3>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {head.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {children.length ? (
              children
            ) : (
              <TableRow>
                <TableCell
                  colSpan={head.length}
                  className="text-center text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer && children.length > 0 && <TableFooter>{footer}</TableFooter>}
        </Table>
      </div>
    </section>
  );
}

const SELECTABLE = PLAN_STATUSES.filter((s) => s !== "REVISI");

function StatusControl({ plan }: { plan: Plan }) {
  const update = useUpdatePlanStatus();
  const [next, setNext] = useState<PlanStatus | "">("");

  return (
    <>
      <SelectInput
        aria-label="Ubah status"
        className="w-40"
        placeholder="Ubah status…"
        value={next}
        onValueChange={(v) => setNext(v as PlanStatus | "")}
        options={SELECTABLE.filter((s) => s !== plan.status).map((s) => ({
          value: s,
          label: STATUS_LABEL[s],
        }))}
      />

      <ConfirmDialog
        open={!!next}
        onOpenChange={(o) => !o && setNext("")}
        title={`Ubah status ke ${next ? STATUS_LABEL[next] : ""}?`}
        description={
          next === "BATAL"
            ? "Plan yang dibatalkan tidak bisa diubah statusnya atau direvisi lagi."
            : `Status ${plan.invoice} akan diubah dari ${STATUS_LABEL[plan.status]}.`
        }
        confirmLabel="Ubah Status"
        destructive={next === "BATAL"}
        isPending={update.isPending}
        onConfirm={() =>
          next &&
          update.mutate(
            { id: plan.id, status: next },
            {
              onSuccess: () => {
                toast.success(`Status diubah ke ${STATUS_LABEL[next]}`);
                setNext("");
              },
              onError: (err) => toast.error(errorMessage(err)),
            },
          )
        }
      />
    </>
  );
}
