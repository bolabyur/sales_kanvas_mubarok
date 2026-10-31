import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useEmployees } from "../../master/employee/hooks/useEmployee";
import { useMarketAreas } from "../../master/market-area/hooks/useMarketArea";
import { useVehicles } from "../../master/vehicle/hooks/useVehicle";
import { useCreatePlan } from "../hooks/usePlan";
import type { PlanPayload, Plan } from "../types/plan.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: Plan | null; 
};

const getLocalDate = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

export function PlanForm({ open, onOpenChange, defaultPlan }: Props) {
  const create = useCreatePlan();
  const { data: areas = [] } = useMarketAreas();
  const { data: vehicles = [] } = useVehicles();
  const { data: employees = [] } = useEmployees();

  const [marketAreaId, setMarketAreaId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [note, setNote] = useState("");
  const [personils, setPersonils] = useState([
    { employee_id: "", position: "Sopir" },
  ]);

  useEffect(() => {
    if (open && defaultPlan) {
      setMarketAreaId(String(defaultPlan.market_area_id || ""));
      setVehicleId(String(defaultPlan.vehicle_id || ""));
      setNote(defaultPlan.note || "");

      const personilsData = defaultPlan.salesKanvasPersonil || [];
      if (personilsData.length > 0) {
        setPersonils(personilsData.map((p: any) => ({ employee_id: String(p.employee_id), position: p.position })));
      }
    } else if (open && !defaultPlan) {
      // Auto-select user yang login sebagai "Sales"
      try {
        const loggedUser = JSON.parse(localStorage.getItem("sk_user") || "{}");
        if (loggedUser?.karyawan_id) {
          setPersonils([
            { employee_id: String(loggedUser.karyawan_id), position: "Sales" },
            { employee_id: "", position: "Sopir" }
          ]);
        }
      } catch (e) {}
      setMarketAreaId("");
      setVehicleId("");
      setNote("");
    }
  }, [open, defaultPlan]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!fd.get("market_area_id") || !fd.get("vehicle_id")) {
      return toast.error("Wilayah dan Kendaraan wajib dipilih!");
    }
    if (personils.some((p) => !p.employee_id)) {
      return toast.error("Lengkapi semua data personil!");
    }

    const tglBerangkat = fd.get("tgl_pergi_kanvas") as string;

    const payload: PlanPayload = {
      tgl_invoice: new Date(tglBerangkat).toISOString(), // Otomatis sama dengan tgl berangkat
      tgl_pergi_kanvas: new Date(tglBerangkat).toISOString(),
      tgl_kembali_kanvas: fd.get("tgl_kembali_kanvas") ? new Date(fd.get("tgl_kembali_kanvas") as string).toISOString() : null,
      market_area_id: Number(fd.get("market_area_id")),
      vehicle_id: Number(fd.get("vehicle_id")),
      note: (fd.get("note") as string) || null,
      salesKanvasPersonil: personils.map((p) => ({ employee_id: Number(p.employee_id), position: p.position })),
      salesKanvasPlanDetail: [], // Barang diinput di BON
    };

    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Rencana Kanvas berhasil dibuat!");
        onOpenChange(false);
      },
      onError: (err: any) => {
        console.error("Gagal membuat plan:", err);
        // ✅ PERBAIKAN: Baca err.details dari backend dan tampilkan ke toast (mencegah layar putih)
        if (err?.details && Array.isArray(err.details)) {
          const messages = err.details.map((e: any) => `${e.field}: ${e.message}`).join(", ");
          toast.error("Validasi Gagal", { description: messages });
        } else {
          toast.error(err.message || "Gagal membuat plan");
        }
      },
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Buat Rencana Kanvas" className="max-w-[95vw] md:max-w-4xl">
      <form onSubmit={handleSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        {/* HEADER: Hanya Tanggal Berangkat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Tgl Berangkat" htmlFor="tgl_pergi_kanvas" required>
            <Input id="tgl_pergi_kanvas" name="tgl_pergi_kanvas" type="date" defaultValue={getLocalDate()} required />
          </FormField>
          <FormField label="Tgl Kembali (Opsional)" htmlFor="tgl_kembali_kanvas">
            <Input id="tgl_kembali_kanvas" name="tgl_kembali_kanvas" type="date" />
          </FormField>
          <FormField label="Wilayah Pasar" htmlFor="market_area_id" required>
            <SelectInput id="market_area_id" name="market_area_id" required options={areas.map((a: any) => ({ value: String(a.id), label: a.name }))} value={marketAreaId} onValueChange={setMarketAreaId} />
          </FormField>
          <FormField label="Kendaraan" htmlFor="vehicle_id" required className="sm:col-span-3">
            <SelectInput id="vehicle_id" name="vehicle_id" required options={vehicles.map((v: any) => ({ value: String(v.id), label: `${v.nopol} - ${v.name}` }))} value={vehicleId} onValueChange={setVehicleId} />
          </FormField>
        </div>

        {/* TIM BERTUGAS */}
        <div className="border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex justify-between items-center pb-2 border-b">
            <h4 className="font-semibold text-sm">Tim Yang Bertugas</h4>
            <Button type="button" size="sm" variant="outline" onClick={() => setPersonils([...personils, { employee_id: "", position: "Sales" }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>
          {personils.map((p, i) => (
            <div key={i} className="flex gap-2 items-end">
              <FormField label="Karyawan" htmlFor={`personil-${i}`} className="flex-1">
                <SelectInput 
                  value={p.employee_id} 
                  onValueChange={(v) => setPersonils(personils.map((item, idx) => idx === i ? { ...item, employee_id: v } : item))}
                  options={employees.map((e: any) => ({ value: String(e.id), label: e.name }))} 
                />
              </FormField>
              <FormField label="Posisi" htmlFor={`posisi-${i}`} className="w-28">
                <SelectInput 
                  value={p.position} 
                  onValueChange={(v) => setPersonils(personils.map((item, idx) => idx === i ? { ...item, position: v } : item))}
                  options={[{ value: "Sales", label: "Sales" }, { value: "Sopir", label: "Sopir" }]} 
                />
              </FormField>
              <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setPersonils(personils.filter((_, idx) => idx !== i))} disabled={personils.length === 1}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <FormField label="Catatan Tambahan" htmlFor="note">
          <Textarea id="note" name="note" rows={2} placeholder="Opsional..." value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan..." : "Simpan Plan"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}