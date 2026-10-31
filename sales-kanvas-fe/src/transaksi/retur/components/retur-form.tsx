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
import { useMe } from "@/auth/hooks/useAuth";
import { formatRupiah } from "@/lib/format";
import type { DetailReturPayload } from "../types/retur.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function ReturForm({ open, onOpenChange }: Props) {
  const create = useCreateRetur();
  const { data: user } = useMe();

  // Ambil Data Master
  const { data: outletResponse } = useOutlet();
  const outlets = Array.isArray(outletResponse) ? outletResponse : ((outletResponse as any)?.items || []);
  
  const { data: gudangResponse } = useGudang();
  const gudangs = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);
  
  const finalGudangs = gudangs.filter((g: any) => {
    const tipe = String(g.tipe_gudang || "").toLowerCase();
    const nama = String(g.nama_gudang || "").toLowerCase();
    return tipe.includes("retur") || nama.includes("retur");
  });

  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : ((productsResponse as any)?.items || []);
  
  const { data: batchesResponse = [] } = useBatches();
  const batches = Array.isArray(batchesResponse) ? batchesResponse : ((batchesResponse as any)?.items || []);
  
  // ✅ PERBAIKAN: Ekstraksi data invoice yang aman
  const { data: invoicesResponse = [] } = useInvoices();
  const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : ((invoicesResponse as any)?.items || []);

  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  
  // ✅ Filter Invoice berdasarkan Outlet DAN Kepemilikan
  const filteredInvoices = invoices.filter((inv: any) => {
    if (inv.outlet_id?.toString() !== selectedOutlet) return false;

    const roleName = user?.role?.name || "";
    const isGlobalRole = ["Super Admin", "Supervisor Pemasaran", "Kasir / Tim Keuangan", "superadmin"].includes(roleName);
    
    if (!isGlobalRole) {
      // Sekarang data salesKanvasPlan harusnya sudah ada dari Backend
      return inv.salesKanvasPlan?.user_id === user?.id;
    }

    return true;
  });

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

  const getHargaProduk = (produkId?: number) => {
    if (!produkId) return 0;
    const prod = products.find((p: any) => p.id === produkId);
    return prod?.produkHargas?.[0]?.harga || 10000; 
  };

  const totalNilaiRetur = details.reduce((sum, d) => sum + ((d.qty || 0) * getHargaProduk(d.produk_id)), 0);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (!selectedOutlet) return toast.error("Pilih Outlet terlebih dahulu!");
    if (!fd.get("gudang_retur_id")) return toast.error("Pilih Gudang Retur Tujuan!");
    if (totalNilaiRetur <= 0) return toast.error("Total Retur tidak valid!");
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
        toast.success("Retur Outlet berhasil diproses (DRAFT)!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || error.message;
        toast.error("Gagal memproses Retur", { description: Array.isArray(msg) ? msg[0].message : msg });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Proses Retur dari Outlet" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-2 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20 w-full min-w-0">
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
              placeholder={selectedOutlet ? (filteredInvoices.length === 0 ? "Tidak ada Invoice" : "Pilih Invoice") : "Pilih Outlet dulu"}
            />
          </FormField>

          <FormField label="Gudang Retur Tujuan" htmlFor="gudang_retur_id" required>
            <SelectInput 
              id="gudang_retur_id" 
              name="gudang_retur_id" 
              required 
              options={finalGudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} 
              placeholder={finalGudangs.length === 0 ? "Gudang Retur tidak ditemukan" : "Pilih Gudang Retur"} 
            />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Barang yang Dikembalikan</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty: 1, alasan_retur: "" }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>
          
          {details.map((d, i) => {
            const today = new Date(); today.setHours(0, 0, 0, 0); 
            const maxReturnDate = new Date(); maxReturnDate.setMonth(maxReturnDate.getMonth() + 3); maxReturnDate.setHours(23, 59, 59, 999); 

            const availableBatches = batches.filter((b: any) => {
              return b.produk_id?.toString() === String(d.produk_id) && !b.is_deleted && 
                     new Date(b.expired_date) >= today && new Date(b.expired_date) <= maxReturnDate;
            });

            const subtotal = (d.qty || 0) * getHargaProduk(d.produk_id);

            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-muted/10 p-3 rounded-md w-full min-w-0">
                <div className="md:col-span-3">
                  <FormField label="Produk" htmlFor={`produk-${i}`} required>
                    <SelectInput id={`produk-${i}`} options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} value={d.produk_id ? String(d.produk_id) : ""} onValueChange={(val) => { const newD = [...details]; newD[i].produk_id = Number(val); newD[i].batch_id = undefined; setDetails(newD); }} />
                  </FormField>
                </div>
                <div className="md:col-span-3">
                  <FormField label="Batch Asal (Max 3 Bln)" htmlFor={`batch-${i}`} required>
                    <SelectInput id={`batch-${i}`} options={availableBatches.map((b: any) => ({ value: String(b.id), label: b.no_batch }))} value={d.batch_id ? String(d.batch_id) : ""} onValueChange={(val) => handleDetailChange(i, "batch_id", Number(val))} placeholder={availableBatches.length === 0 ? "Tidak ada batch" : "Pilih Batch"} />
                  </FormField>
                </div>
                <div className="md:col-span-1">
                  <FormField label="Qty" htmlFor={`qty-${i}`} required>
                    <Input id={`qty-${i}`} type="number" min={1} value={d.qty} onChange={(e) => handleDetailChange(i, "qty", Number(e.target.value))} />
                  </FormField>
                </div>
                <div className="md:col-span-3">
                  <FormField label="Alasan" htmlFor={`alasan-${i}`} required>
                    <Input id={`alasan-${i}`} placeholder="Cth: Rusak" value={d.alasan_retur} onChange={(e) => handleDetailChange(i, "alasan_retur", e.target.value)} />
                  </FormField>
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between pb-2">
                   <div className="text-xs text-muted-foreground mr-2">
                     Subtotal: <br/> <strong className="text-foreground">{formatRupiah(subtotal)}</strong>
                   </div>
                   <Button type="button" variant="ghost" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg border flex justify-between items-center w-full">
          <span className="font-semibold text-sm">Total Nilai Retur:</span>
          <span className="text-xl font-bold text-primary">{formatRupiah(totalNilaiRetur)}</span>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending || totalNilaiRetur <= 0}>Simpan Retur (Draft)</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}