import { useState } from "react";
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
import { useProducts } from "../../master/product/hooks/useProduct";
import { useVehicles } from "../../master/vehicle/hooks/useVehicle";
import { useCreatePlan } from "../hooks/usePlan";
import type { PlanPayload } from "../types/plan.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };
const today = () => new Date().toLocaleDateString("en-CA");

export function PlanForm({ open, onOpenChange }: Props) {
  const create = useCreatePlan();
  const { data: areas = [] } = useMarketAreas();
  const { data: vehicles = [] } = useVehicles();
  const { data: employees = [] } = useEmployees();
  const { data: products = [] } = useProducts();

  const [personils, setPersonils] = useState([{ employee_id: "", position: "Sopir" }]);
  const [details, setDetails] = useState([{ product_id: "", qty: 1 }]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!fd.get("market_area_id") || !fd.get("vehicle_id")) {
      return toast.error("Wilayah dan Kendaraan wajib dipilih!");
    }
    if (personils.some(p => !p.employee_id)) {
      return toast.error("Lengkapi semua data personil!");
    }
    if (details.some(d => !d.product_id)) {
      return toast.error("Lengkapi semua data produk!");
    }

    const payload: PlanPayload = {
      tgl_invoice: new Date(fd.get("tgl_invoice") as string).toISOString(),
      tgl_pergi_kanvas: new Date(fd.get("tgl_pergi_kanvas") as string).toISOString(),
      tgl_kembali_kanvas: fd.get("tgl_kembali_kanvas") ? new Date(fd.get("tgl_kembali_kanvas") as string).toISOString() : null,
      market_area_id: Number(fd.get("market_area_id")),
      vehicle_id: Number(fd.get("vehicle_id")),
      note: (fd.get("note") as string) || null,
      salesKanvasPersonil: personils.map(p => ({ employee_id: Number(p.employee_id), position: p.position })),
      salesKanvasPlanDetail: details.map(d => ({ product_id: Number(d.product_id), qty: Number(d.qty) })),
    };

    console.log("Mengirim Payload:", payload); 

    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Rencana Kanvas berhasil dibuat!");
        onOpenChange(false);
        setPersonils([{ employee_id: "", position: "Sopir" }]);
        setDetails([{ product_id: "", qty: 1 }]);
      },
      onError: (err: any) => {
        console.error("Gagal membuat plan:", err);
      }
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Buat Rencana Kanvas" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={handleSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Tgl Invoice" htmlFor="tgl_invoice" required>
            <Input id="tgl_invoice" name="tgl_invoice" type="date" defaultValue={today()} required />
          </FormField>
          <FormField label="Tgl Berangkat" htmlFor="tgl_pergi_kanvas" required>
            <Input id="tgl_pergi_kanvas" name="tgl_pergi_kanvas" type="date" defaultValue={today()} required />
          </FormField>
          <FormField label="Tgl Kembali" htmlFor="tgl_kembali_kanvas">
            <Input id="tgl_kembali_kanvas" name="tgl_kembali_kanvas" type="date" />
          </FormField>
          
          <FormField label="Wilayah Pasar" htmlFor="market_area_id" required className="sm:col-span-1">
            <SelectInput id="market_area_id" name="market_area_id" required options={areas.map(a => ({ value: String(a.id), label: a.name }))} />
          </FormField>
          <FormField label="Kendaraan" htmlFor="vehicle_id" required className="sm:col-span-2">
            <SelectInput id="vehicle_id" name="vehicle_id" required options={vehicles.map(v => ({ value: String(v.id), label: `${v.nopol} - ${v.name}` }))} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
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
                    options={employees.map(e => ({ value: String(e.id), label: e.name }))} 
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

          <div className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex justify-between items-center pb-2 border-b">
              <h4 className="font-semibold text-sm">Estimasi Barang Dibawa</h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { product_id: "", qty: 1 }])}>
                <Plus className="h-4 w-4 mr-1" /> Tambah
              </Button>
            </div>
            {details.map((d, i) => (
              <div key={i} className="flex gap-2 items-end">
                <FormField label="Produk" htmlFor={`produk-${i}`} className="flex-1">
                  <SelectInput 
                    value={d.product_id} 
                    onValueChange={(v) => setDetails(details.map((item, idx) => idx === i ? { ...item, product_id: v } : item))}
                    options={products.map(p => ({ value: String(p.id), label: p.name }))} 
                  />
                </FormField>
                <FormField label="Qty" htmlFor={`qty-${i}`} className="w-24">
                  <Input 
                    type="number" min={1} value={d.qty} 
                    onChange={(e) => setDetails(details.map((item, idx) => idx === i ? { ...item, qty: Number(e.target.value) } : item))} 
                  />
                </FormField>
                <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

        </div>

        <FormField label="Catatan Tambahan" htmlFor="note">
          <Textarea id="note" name="note" rows={2} placeholder="Opsional..." />
        </FormField>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Menyimpan..." : "Simpan Plan"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}