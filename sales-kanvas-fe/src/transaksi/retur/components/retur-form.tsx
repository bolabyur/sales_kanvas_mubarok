import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateRetur } from "../hooks/useRetur";
import { useOutlet } from "@/master/outlet/hooks/useOutlet";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import { useInvoices } from "@/transaksi/invoice/hooks/useInvoice";
import type { DetailReturPayload } from "../types/retur.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function ReturForm({ open, onOpenChange }: Props) {
  const create = useCreateRetur();
  
  const { data: outletResponse } = useOutlet();
  const outlets = Array.isArray(outletResponse) ? outletResponse : ((outletResponse as any)?.items || []);
  
  const { data: gudangResponse } = useGudang();
  const gudangs = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);
  const gudangReturs = gudangs.filter((g: any) => g.tipe_gudang?.toLowerCase().includes("retur") || g.nama_gudang.toLowerCase().includes("retur"));
  const finalGudangs = gudangReturs.length > 0 ? gudangReturs : gudangs; 
  
  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : ((productsResponse as any)?.items || []);
  
  const { data: batches = [] } = useBatches();
  
  const { data: invoices = [] } = useInvoices();

  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  
  const filteredInvoices = invoices.filter((inv: any) => inv.outlet_id.toString() === selectedOutlet);

  const [details, setDetails] = useState<Partial<DetailReturPayload>[]>([
    { produk_id: undefined, batch_id: undefined, qty: 1, alasan_retur: "" }
  ]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setDetails([{ produk_id: undefined, batch_id: undefined, qty: 1, alasan_retur: "" }]);
      setSelectedOutlet("");
      setInvoiceId("");
    }
    onOpenChange(o);
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const totalNilaiRetur = details.reduce((sum, item) => sum + ((item.qty || 0) * 10000), 0);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (!selectedOutlet) return toast.error("Pilih Outlet terlebih dahulu!");
    if (details.some(d => !d.produk_id || !d.batch_id || !d.qty || !d.alasan_retur)) {
      return toast.error("Lengkapi semua data barang dan alasan retur!");
    }

    create.mutate({
      outlet_id: Number(selectedOutlet),
      invoice_outlet_id: invoiceId ? Number(invoiceId) : null,
      gudang_retur_id: Number(fd.get("gudang_retur_id")),
      total_nilai_retur: totalNilaiRetur,
      details: details as DetailReturPayload[],
    }, {
      onSuccess: () => {
        toast.success("Retur Outlet berhasil diproses!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal memproses Retur", { description: error.response?.data?.message || error.message });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Proses Retur dari Outlet" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Pilih Outlet" htmlFor="outlet_id" required>
            <SelectInput 
              id="outlet_id" required 
              options={outlets.map((o: any) => ({ value: String(o.id), label: o.nama_toko }))} 
              value={selectedOutlet} onValueChange={(val) => { setSelectedOutlet(val); setInvoiceId(""); }}
              placeholder="Pilih Outlet"
            />
          </FormField>

          <FormField label="Pilih Invoice (Opsional)" htmlFor="invoice_outlet_id">
            <SelectInput 
              id="invoice_outlet_id" 
              options={filteredInvoices.map((inv: any) => ({ value: String(inv.id), label: `INV #${inv.id} - Rp ${Number(inv.total_tagihan).toLocaleString('id-ID')}` }))} 
              value={invoiceId} onValueChange={setInvoiceId}
              placeholder={selectedOutlet ? "Pilih Invoice (Jika ada)" : "Pilih Outlet dulu"}
            />
          </FormField>

          <FormField label="Gudang Retur Tujuan" htmlFor="gudang_retur_id" required>
            <SelectInput id="gudang_retur_id" name="gudang_retur_id" required options={finalGudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang Retur" />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Barang yang Dikembalikan</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty: 1, alasan_retur: "" }])}>
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
                <FormField label="Batch Asal" htmlFor={`batch-${i}`} required>
                  <SelectInput 
                    id={`batch-${i}`}
                    options={availableBatches.map((b: any) => ({ value: String(b.id), label: b.no_batch }))} 
                    value={d.batch_id ? String(d.batch_id) : ""}
                    onValueChange={(val) => handleDetailChange(i, "batch_id", Number(val))}
                  />
                </FormField>
                <FormField label="Qty Retur" htmlFor={`qty-${i}`} required>
                  <Input id={`qty-${i}`} type="number" min={1} value={d.qty} onChange={(e) => handleDetailChange(i, "qty", Number(e.target.value))} />
                </FormField>
                <FormField label="Alasan Retur" htmlFor={`alasan-${i}`} required>
                  <Input id={`alasan-${i}`} placeholder="Cth: Rusak / Expired" value={d.alasan_retur} onChange={(e) => handleDetailChange(i, "alasan_retur", e.target.value)} />
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
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Memproses…" : "Simpan Retur"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}