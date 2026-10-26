import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateProdukDestruction } from "../hooks/useProdukDestruction";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import type { DetailDestructionPayload } from "../types/produk-destruction.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function ProdukDestructionForm({ open, onOpenChange }: Props) {
  const create = useCreateProdukDestruction();
  
  const { data: gudangResponse } = useGudang();
  const gudangs = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);
  
  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : ((productsResponse as any)?.items || []);
  
  const { data: batches = [] } = useBatches();

  const [details, setDetails] = useState<Partial<DetailDestructionPayload>[]>([
    { produk_id: undefined, batch_id: undefined, qty_dimusnahkan: 1 }
  ]);

  const handleOpenChange = (o: boolean) => {
    if (!o) setDetails([{ produk_id: undefined, batch_id: undefined, qty_dimusnahkan: 1 }]);
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (details.some(d => !d.produk_id || !d.batch_id || !d.qty_dimusnahkan)) {
      return toast.error("Lengkapi semua data barang!");
    }

    create.mutate({
      gudang_id: Number(fd.get("gudang_id")),
      tgl_destruction: new Date(fd.get("tgl_destruction") as string).toISOString(),
      alasan: String(fd.get("alasan")),
      details: details as DetailDestructionPayload[],
    }, {
      onSuccess: () => {
        toast.success("Disposal barang berhasil dicatat!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal Disposal", { description: error.response?.data?.message || error.message }); 
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Form Disposal Barang" className="max-w-[95vw] md:max-w-4xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Gudang Asal (Barang Rusak)" htmlFor="gudang_id" required>
            <SelectInput id="gudang_id" name="gudang_id" required options={gudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang" />
          </FormField>
          <FormField label="Tanggal Disposal" htmlFor="tgl_destruction" required>
            <Input id="tgl_destruction" name="tgl_destruction" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
          <FormField label="Alasan Disposal" htmlFor="alasan" required className="sm:col-span-2">
            <Input id="alasan" name="alasan" placeholder="Contoh: Barang basi / kadaluarsa" required />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Daftar Barang yang Di-disposal</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty_dimusnahkan: 1 }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>
          
          {details.map((d, i) => {
            const availableBatches = batches.filter((b: any) => b.produk_id.toString() === String(d.produk_id));
            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-muted/10 p-3 rounded-md">
                <FormField label="Produk" htmlFor={`produk-${i}`} required>
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
                <FormField label="Qty Disposal" htmlFor={`qty-${i}`} required>
                  <Input id={`qty-${i}`} type="number" min={1} value={d.qty_dimusnahkan} onChange={(e) => { const newD = [...details]; newD[i].qty_dimusnahkan = Number(e.target.value); setDetails(newD); }} />
                </FormField>
                <Button type="button" variant="destructive" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" variant="destructive" disabled={create.isPending}>
            {create.isPending ? "Memproses…" : "Proses Disposal"} {/* <-- Ganti Teks Tombol */}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}