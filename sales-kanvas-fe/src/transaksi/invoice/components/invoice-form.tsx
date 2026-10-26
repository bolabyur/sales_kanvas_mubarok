import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateInvoice } from "../hooks/useInvoice";
import { usePlans } from "@/plan/hooks/usePlan";
import { useOutlet } from "@/master/outlet/hooks/useOutlet"; 
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import type { DetailInvoicePayload } from "../types/invoice.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const TIPE_PEMBAYARAN = [
  { value: "Tunai", label: "Tunai" },
  { value: "Kredit", label: "Kredit (Piutang)" },
];

export function InvoiceForm({ open, onOpenChange }: Props) {
  const create = useCreateInvoice();
  
  const { data: planResponse } = usePlans();
  const approvedPlans = ((planResponse as any)?.items || []).filter((p: any) => p.status === "DISETUJUI");
  
  const { data: outletResponse } = useOutlet();
  const outlets = Array.isArray(outletResponse) ? outletResponse : ((outletResponse as any)?.items || []);
  
  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : ((productsResponse as any)?.items || []);
  
  const { data: batches = [] } = useBatches();

  const [details, setDetails] = useState<Partial<DetailInvoicePayload>[]>([
    { produk_id: undefined, batch_id: undefined, qty: 1, harga_satuan: 0 }
  ]);

  const handleOpenChange = (o: boolean) => {
    if (!o) setDetails([{ produk_id: undefined, batch_id: undefined, qty: 1, harga_satuan: 0 }]);
    onOpenChange(o);
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const totalTagihan = details.reduce((sum, item) => sum + ((item.qty || 0) * (item.harga_satuan || 0)), 0);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (details.some(d => !d.produk_id || !d.batch_id || !d.qty || !d.harga_satuan)) {
      return toast.error("Lengkapi semua data barang!");
    }

    create.mutate({
      outlet_id: Number(fd.get("outlet_id")),
      sales_kanvas_plan_id: Number(fd.get("sales_kanvas_plan_id")),
      tipe_pembayaran: fd.get("tipe_pembayaran") as "Tunai" | "Kredit",
      tgl_invoice: new Date(fd.get("tgl_invoice") as string).toISOString(),
      details: details as DetailInvoicePayload[],
    }, {
      onSuccess: () => {
        toast.success("Invoice berhasil dibuat!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal membuat Invoice", { description: error.response?.data?.message || error.message });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Buat Invoice Penjualan" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Pilih Plan" htmlFor="sales_kanvas_plan_id" required>
            <SelectInput id="sales_kanvas_plan_id" name="sales_kanvas_plan_id" required options={approvedPlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))} placeholder="Pilih Plan" />
          </FormField>
          <FormField label="Pilih Outlet" htmlFor="outlet_id" required>
            <SelectInput id="outlet_id" name="outlet_id" required options={outlets.map((o: any) => ({ value: String(o.id), label: o.nama_toko }))} placeholder="Pilih Outlet" />
          </FormField>
          <FormField label="Tgl Invoice" htmlFor="tgl_invoice" required>
            <Input id="tgl_invoice" name="tgl_invoice" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
          <FormField label="Tipe Pembayaran" htmlFor="tipe_pembayaran" required>
            <SelectInput id="tipe_pembayaran" name="tipe_pembayaran" required options={TIPE_PEMBAYARAN} placeholder="Pilih Tipe" />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Detail Barang Terjual</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty: 1, harga_satuan: 0 }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>
          
          {details.map((d, i) => {
            const availableBatches = batches.filter((b: any) => b.produk_id.toString() === String(d.produk_id));
            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-muted/10 p-3 rounded-md">
                <FormField label="Produk" htmlFor={`produk-${i}`} required>
                  <SelectInput 
                    id={`produk-${i}`}
                    options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} 
                    value={d.produk_id ? String(d.produk_id) : ""}
                    onValueChange={(val) => {
                      const newD = [...details]; 
                      newD[i].produk_id = Number(val); 
                      newD[i].batch_id = undefined; 
                      setDetails(newD);
                    }}
                  />
                </FormField>
                <FormField label="Batch" htmlFor={`batch-${i}`} required>
                  <SelectInput 
                    id={`batch-${i}`}
                    options={availableBatches.map((b: any) => ({ value: String(b.id), label: `${b.no_batch} (Stok: ${b.stok_gudang})` }))} 
                    value={d.batch_id ? String(d.batch_id) : ""}
                    onValueChange={(val) => handleDetailChange(i, "batch_id", Number(val))}
                  />
                </FormField>
                <FormField label="Qty" htmlFor={`qty-${i}`} required>
                  <Input id={`qty-${i}`} type="number" min={1} value={d.qty} onChange={(e) => handleDetailChange(i, "qty", Number(e.target.value))} />
                </FormField>
                <FormField label="Harga Satuan" htmlFor={`harga-${i}`} required>
                  <Input id={`harga-${i}`} type="number" min={0} value={d.harga_satuan} onChange={(e) => handleDetailChange(i, "harga_satuan", Number(e.target.value))} />
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

        <div className="flex justify-between items-center bg-primary text-primary-foreground p-4 rounded-lg">
          <span className="font-semibold">Total Tagihan:</span>
          <span className="text-2xl font-bold">Rp {totalTagihan.toLocaleString('id-ID')}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Simpan Invoice"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}