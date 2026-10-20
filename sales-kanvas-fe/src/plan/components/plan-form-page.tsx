import { useState, type SubmitEvent } from "react";
import { Link,useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { SelectInput } from "@/components/shared/select-input";
import { useEmployees } from "@/master/employee/hooks/useEmployee";
import { useMarketAreas } from "@/master/market-area/hooks/useMarketArea";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useVehicles } from "@/master/vehicle/hooks/useVehicle";
import { toDateInput } from "@/lib/format";
import {  text, textOrNull, type FieldErrors } from "@/lib/form";
import { useCreatePlan, usePlan, useRevisePlan } from "../hooks/usePlan";
import type { Plan } from "../types/plan.types";
import {
  DetailFields,
  PersonilFields,
  type DetailRow,
  type PersonilRow,
} from "./plan-items-fields";

export function PlanFormPage() {
  const planId = Number(useParams().id ?? 0);
  const { data: plan, isLoading, isError } = usePlan(planId);

  if (planId) {
    if (isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
    if (isError || !plan) return <p className="text-sm text-muted-foreground">Plan tidak ditemukan.</p>;
    if (plan.status === "BATAL") {
      return <p className="text-sm text-muted-foreground">Plan yang sudah dibatalkan tidak dapat direvisi.</p>;
    }
  }
  return <PlanForm key={planId} plan={plan ?? null} />;
}

function withCurrent<T extends { id: number }>(list: T[], current: T[] = []) {
  const ids = new Set(list.map((x) => x.id));
  return [...list, ...current.filter((x) => !ids.has(x.id))];
}

const today = () => new Date().toLocaleDateString("en-CA");

function PlanForm({ plan }: { plan: Plan | null }) {
  const create = useCreatePlan();
  const revise = useRevisePlan();
  const save = plan ? revise : create;

  const { data: marketAreas = [] } = useMarketAreas();
  const { data: vehicles = [] } = useVehicles();
  const { data: employees = [] } = useEmployees();
  const { data: products = [] } = useProducts();

  const [errors, setErrors] = useState<FieldErrors>({});
  const [personils, setPersonils] = useState<PersonilRow[]>(
    plan?.salesKanvasPersonil.map((p) => ({ employee_id: String(p.employee_id), position: p.position })) ?? [
      { employee_id: "", position: "Sopir" },
    ],
  );
  const [details, setDetails] = useState<DetailRow[]>(
    plan?.salesKanvasPlanDetail.map((d) => ({ product_id: String(d.product_id), qty: String(d.qty) })) ?? [
      { product_id: "", qty: "" },
    ],
  );

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pergi = text(fd, "tgl_pergi_kanvas");
    const kembali = textOrNull(fd, "tgl_kembali_kanvas");
    
    if (kembali && kembali < pergi) {
      setErrors({ tgl_kembali_kanvas: "Tanggal kembali tidak boleh sebelum tanggal pergi" });
      return;
    }
    setErrors({});

    if (personils.some(p => !p.employee_id)) {
      toast.error("Pilih karyawan untuk semua baris personil.");
      return;
    }
    if (details.some(d => !d.product_id)) {
      toast.error("Pilih produk untuk semua baris detail.");
      return;
    }

    




  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-4xl gap-6">
      <div>
        <h2 className="text-xl font-semibold">
          {plan ? `Revisi ${plan.invoice}` : "Buat Sales Kanvas Plan"}
        </h2>
        {plan && (
          <p className="text-sm text-muted-foreground">
            Menyimpan revisi akan membatalkan plan ini dan membuat plan baru dengan invoice baru
            (revisi ke-{plan.revision + 1}).
          </p>
        )}
      </div>

      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <FormField label="Tgl. Invoice" htmlFor="tgl_invoice" required error={errors.tgl_invoice}>
          <Input id="tgl_invoice" name="tgl_invoice" type="date" required defaultValue={toDateInput(plan?.tgl_invoice) || today()} />
        </FormField>
        <FormField label="Tgl. Pergi Kanvas" htmlFor="tgl_pergi_kanvas" required error={errors.tgl_pergi_kanvas}>
          <Input id="tgl_pergi_kanvas" name="tgl_pergi_kanvas" type="date" required defaultValue={toDateInput(plan?.tgl_pergi_kanvas) || today()} />
        </FormField>
        <FormField label="Tgl. Kembali Kanvas" htmlFor="tgl_kembali_kanvas" error={errors.tgl_kembali_kanvas}>
          <Input
            id="tgl_kembali_kanvas"
            name="tgl_kembali_kanvas"
            type="date"
            defaultValue={toDateInput(plan?.tgl_kembali_kanvas)}
            aria-invalid={!!errors.tgl_kembali_kanvas}
          />
        </FormField>
        <FormField label="Market Area" htmlFor="market_area_id" required error={errors.market_area_id}>
          <SelectInput
            id="market_area_id"
            name="market_area_id"
            required
            aria-invalid={!!errors.market_area_id}
            options={withCurrent(marketAreas, plan ? [plan.marketArea] : []).map((m) => ({
              value: String(m.id),
              label: m.name,
            }))}
            defaultValue={plan?.market_area_id.toString()}
          />
        </FormField>
        <FormField label="Kendaraan" htmlFor="vehicle_id" required error={errors.vehicle_id} className="sm:col-span-2">
          <SelectInput
            id="vehicle_id"
            name="vehicle_id"
            required
            aria-invalid={!!errors.vehicle_id}
            options={withCurrent(vehicles, plan ? [plan.vehicle] : []).map((v) => ({
              value: String(v.id),
              label: `${v.nopol} — ${v.name}`,
            }))}
            defaultValue={plan?.vehicle_id.toString()}
          />
        </FormField>
        <FormField label="Catatan" htmlFor="note" className="sm:col-span-3">
          <Textarea id="note" name="note" rows={2} defaultValue={plan?.note ?? ""} />
        </FormField>
      </section>

      <PersonilFields
        rows={personils}
        onChange={setPersonils}
        options={withCurrent(employees, plan?.salesKanvasPersonil.map((p) => p.employee))}
      />
      <DetailFields
        rows={details}
        onChange={setDetails}
        options={withCurrent(products, plan?.salesKanvasPlanDetail.map((d) => d.product))}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link to={plan ? `/plan/${plan.id}` : "/plan"} />}
        >
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : plan ? "Simpan Revisi" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}