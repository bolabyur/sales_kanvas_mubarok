import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateKanvasReturn } from "../hooks/useKanvasReturn";
import { usePlans } from "@/plan/hooks/usePlan";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import type { DetailKanvasReturnPayload } from "../types/kanvas-return.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function KanvasReturnForm({ open, onOpenChange }: Props) {
  const create = useCreateKanvasReturn();
  
  const { data: planResponse } = usePlans();
  const approvedPlans = ((planResponse as any)?.items || []).filter((p: any) => p.status === "DISETUJUI");
  
  const { data: gudangResponse } = useGudang();
  const gudangs = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);
  
  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : ((productsResponse as any)?.items || []);
  
  const { data: batches = [] } = useBatches();

  const [details, setDetails] = useState<Partial<DetailKanvasReturnPayload>[]>([
    { produk_id: undefined, batch_id: undefined, qty: 1, kondisi: "BAGUS" }
  ]);

  const handleOpenChange = (o: boolean) => {
    if (!o) setDetails([{ produk_id: undefined, batch_id: undefined, qty: 1, kondisi: "BAGUS" }]);
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (details.some(d => !d.produk_id || !d.batch_id || !d.qty)) {
      return toast.error("Lengkapi semua data barang!");
    }

    create.mutate({
      sales_kanvas_plan_id: Number(fd.get("sales_kanvas_plan_id")),
      gudang_tujuan_id: Number(fd.get("gudang_tujuan_id")),
      tgl_retur: new Date(fd.get("tgl_retur") as string).toISOString(),
      details: details as DetailKanvasReturnPayload[],
    }, {
      onSuccess: () => {
        toast.success("Retur Kanvas berhasil disimpan!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal Retur", { description: error.response?.data?.message || error.message });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Input Retur dari Sales" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Pilih Plan" htmlFor="sales_kanvas_plan_id" required>
            <SelectInput id="sales_kanvas_plan_id" name="sales_kanvas_plan_id" required options={approvedPlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))} placeholder="Pilih Plan" />
          </FormField>
          <FormField label="Gudang Retur" htmlFor="gudang_tujuan_id" required>
            <SelectInput id="gudang_tujuan_id" name="gudang_tujuan_id" required options={gudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang" />
          </FormField>
          <FormField label="Tanggal Retur" htmlFor="tgl_retur" required>
            <Input id="tgl_retur" name="tgl_retur" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Rincian Barang Sisa</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty: 1, kondisi: "BAGUS" }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>
          
          {details.map((d, i) => {
            const availableBatches = batches.filter((b: any) => b.produk_id.toString() === String(d.produk_id));
            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-muted/10 p-3 rounded-md">
                <FormField label="Produk" htmlFor={`produk-${i}`} required className="md:col-span-2">
                  <SelectInput 
                    id={`produk-${i}`}
                    options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} 
                    value={d.produk_id ? String(d.produk_id) : ""}
                    onValueChange={(val) => {
                      const newD = [...details]; newD[i].produk_id = Number(val); newD[i].batch_id = undefined; setDetails(newD);
                    }}
                  />
                </FormField>
                <FormField label="No Batch" htmlFor={`batch-${i}`} required>
                  <SelectInput 
                    id={`batch-${i}`}
                    options={availableBatches.map((b: any) => ({ value: String(b.id), label: b.no_batch }))} 
                    value={d.batch_id ? String(d.batch_id) : ""}
                    onValueChange={(val) => { const newD = [...details]; newD[i].batch_id = Number(val); setDetails(newD); }}
                  />
                </FormField>
                <FormField label="Qty" htmlFor={`qty-${i}`} required>
                  <Input id={`qty-${i}`} type="number" min={1} value={d.qty} onChange={(e) => { const newD = [...details]; newD[i].qty = Number(e.target.value); setDetails(newD); }} />
                </FormField>
                <FormField label="Kondisi" htmlFor={`kondisi-${i}`} required>
                  <SelectInput 
                    id={`kondisi-${i}`}
                    options={[
                      { value: "BAGUS", label: "Bagus (Masuk Stok)" }, 
                      { value: "RUSAK", label: "Rusak (Karantina)" },
                      { value: "EXPIRED", label: "Expired" }
                    ]} 
                    value={d.kondisi}
                    onValueChange={(val: any) => { const newD = [...details]; newD[i].kondisi = val; setDetails(newD); }}
                  />
                </FormField>
                <div className="flex items-end gap-2">
                   <Button type="button" variant="destructive" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Simpan Retur"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}