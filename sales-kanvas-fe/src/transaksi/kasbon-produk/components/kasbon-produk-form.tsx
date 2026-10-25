import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateKasbonProduk } from "../hooks/useKasbonProduk";
import { usePlans } from "@/plan/hooks/usePlan";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import { formatDate } from "@/lib/format";

export function KasbonProdukForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateKasbonProduk();
  const { data: planResponse } = usePlans();
  const { data: products = [] } = useProducts();
  const { data: batches = [] } = useBatches();
  
  const approvedPlans = (planResponse?.items || []).filter((p: any) => p.status === "DISETUJUI");
  
  const [planId, setPlanId] = useState("");
  const [details, setDetails] = useState([{ product_id: "", batch_id: "", qty_bawa: 1 }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return toast.error("Pilih Rencana Kanvas terlebih dahulu.");
    if (details.some(d => !d.product_id || !d.batch_id)) return toast.error("Lengkapi data produk dan batch.");

    create.mutate({
      sales_kanvas_plan_id: Number(planId),
      details: details.map(d => ({
        produk_id: Number(d.product_id),
        batch_id: Number(d.batch_id),
        qty_bawa: Number(d.qty_bawa),
      })),
    }, {
      onSuccess: () => {
        toast.success("BON Barang berhasil diajukan!");
        onOpenChange(false);
        setPlanId("");
        setDetails([{ product_id: "", batch_id: "", qty_bawa: 1 }]);
      }
    });
  };

  return (
    // PERBAIKAN: Modal dibuat lebih lebar (max-w-5xl)
    <Modal open={open} onOpenChange={onOpenChange} title="Ajukan BON Barang" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={handleSubmit} className="grid gap-4 max-h-[75vh] overflow-y-auto overflow-x-hidden px-1 pb-2">
        
        <FormField label="Pilih Rencana Kanvas (Disetujui)" htmlFor="plan_id" required>
          <SelectInput 
            id="plan_id" 
            required 
            options={approvedPlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))} 
            value={planId}
            onValueChange={setPlanId}
            placeholder={approvedPlans.length === 0 ? "Tidak ada Plan yang disetujui" : "Pilih Plan"}
          />
        </FormField>

        <div className="border rounded-lg p-4 space-y-3 bg-muted/10">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-sm">Daftar Barang yang Diminta</h4>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { product_id: "", batch_id: "", qty_bawa: 1 }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>
          
          {details.map((d, i) => {
            const availableBatches = batches.filter((b: any) => b.produk_id.toString() === d.product_id);

            return (
              // PERBAIKAN: Grid 12 kolom untuk proporsi landscape yang pas
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end w-full border-b pb-4 mb-2 last:border-0 last:pb-0 last:mb-0">
                
                {/* Produk: 4 Kolom */}
                <div className="sm:col-span-4">
                  <FormField label="Produk" htmlFor={`prod-${i}`}>
                    <SelectInput 
                      value={d.product_id} 
                      onValueChange={(v) => setDetails(details.map((item, idx) => idx === i ? { ...item, product_id: v, batch_id: "" } : item))}
                      options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} 
                    />
                  </FormField>
                </div>
                
                {/* Batch: 5 Kolom (Diberi ruang lebih lega) */}
                <div className="sm:col-span-5">
                  <FormField label="Batch (No / ED)" htmlFor={`batch-${i}`}>
                    <SelectInput 
                      disabled={!d.product_id}
                      value={d.batch_id} 
                      onValueChange={(v) => setDetails(details.map((item, idx) => idx === i ? { ...item, batch_id: v } : item))}
                      options={availableBatches.map((b: any) => ({ 
                        value: String(b.id), 
                        label: `${b.no_batch} (ED: ${formatDate(b.expired_date)})` 
                      }))} 
                      placeholder={d.product_id ? "Pilih Batch" : "Pilih Produk Dulu"}
                    />
                  </FormField>
                </div>
                
                {/* Qty: 2 Kolom */}
                <div className="sm:col-span-2">
                  <FormField label="Qty" htmlFor={`qty-${i}`}>
                    <Input 
                      type="number" min={1} value={d.qty_bawa} 
                      onChange={(e) => setDetails(details.map((item, idx) => idx === i ? { ...item, qty_bawa: Number(e.target.value) } : item))} 
                    />
                  </FormField>
                </div>

                {/* Hapus: 1 Kolom */}
                <div className="sm:col-span-1 flex justify-end pb-1">
                   <Button type="button" variant="ghost" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1} title="Hapus baris">
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending || approvedPlans.length === 0}>
            {create.isPending ? "Mengajukan..." : "Ajukan BON"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}