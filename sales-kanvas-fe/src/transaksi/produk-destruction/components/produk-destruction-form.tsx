import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X, AlertTriangle, ShieldCheck } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useCreateProdukDestruction } from "../hooks/useProdukDestruction";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";
import type { DetailDestructionPayload } from "../types/produk-destruction.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const ALASAN_OPTIONS = [
  { value: "Expired", label: "Barang Expired" },
  { value: "Rusak", label: "Barang Rusak / Bocor" },
  { value: "Basi", label: "Basi" },
  { value: "Lainnya", label: "Lainnya" },
];

const getLocalDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

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
  const [onlyExpired, setOnlyExpired] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem("sk_user") || "{}");
  const petugasName = currentUser?.name || "Admin Gudang";

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setDetails([{ produk_id: undefined, batch_id: undefined, qty_dimusnahkan: 1 }]);
      setOnlyExpired(false);
    }
    onOpenChange(o);
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    if (field === "produk_id") newDetails[index].batch_id = undefined; 
    setDetails(newDetails);
  };

  const totalQty = details.reduce((sum, d) => sum + (d.qty_dimusnahkan || 0), 0);
  const totalBatch = details.filter(d => d.batch_id).length;

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (details.some(d => !d.produk_id || !d.batch_id || !d.qty_dimusnahkan)) {
      return toast.error("Lengkapi semua data barang!");
    }
    
    const isOverStock = details.some((d) => {
      const batch = batches.find((b: any) => b.id === d.batch_id);
      return batch && d.qty_dimusnahkan! > batch.stok_gudang;
    });
    if (isOverStock) return toast.error("Qty melebihi stok batch yang tersedia!");

    setConfirmOpen(true);
  }

  function processDisposal() {
    const form = document.getElementById("disposal-form") as HTMLFormElement;
    const fd = new FormData(form);

    create.mutate({
      gudang_id: Number(fd.get("gudang_id")),
      tgl_destruction: new Date(fd.get("tgl_destruction") as string).toISOString(),
      alasan: String(fd.get("alasan")),
      details: details as DetailDestructionPayload[],
    }, {
      onSuccess: () => {
        toast.success("Disposal barang berhasil dicatat!");
        setConfirmOpen(false);
        handleOpenChange(false);
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || error.message;
        toast.error("Gagal Disposal", { description: Array.isArray(msg) ? msg[0].message : msg }); 
        setConfirmOpen(false);
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Berita Acara Pemusnahan Barang" className="max-w-[95vw] md:max-w-5xl">
      <form id="disposal-form" onSubmit={onSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-2 pb-4">
        
        {/* HEADER FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border p-4 rounded-lg bg-muted/20 w-full min-w-0">
          <FormField label="Gudang Asal" htmlFor="gudang_id" required>
            <SelectInput id="gudang_id" name="gudang_id" required options={gudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang" />
          </FormField>
          <FormField label="Tanggal Disposal" htmlFor="tgl_destruction" required>
            <Input id="tgl_destruction" name="tgl_destruction" type="datetime-local" required defaultValue={getLocalDateTime()} />
          </FormField>
          <FormField label="Petugas (Otomatis)" htmlFor="petugas">
            <Input id="petugas" value={petugasName} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
          </FormField>
          <FormField label="Alasan Disposal" htmlFor="alasan" required>
            <SelectInput id="alasan" name="alasan" required options={ALASAN_OPTIONS} placeholder="Pilih Alasan" />
          </FormField>
        </div>

        {/* DETAIL BARANG DINAMIS */}
        <div className="border p-4 rounded-lg bg-card space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-2">
            <h3 className="font-semibold text-sm">Daftar Barang yang Dimusnahkan</h3>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="only-expired" checked={onlyExpired} onCheckedChange={setOnlyExpired} />
                <label htmlFor="only-expired" className="text-xs font-medium cursor-pointer text-destructive">Hanya tampilkan Expired</label>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, batch_id: undefined, qty_dimusnahkan: 1 }])}>
                <Plus className="h-4 w-4 mr-1" /> Tambah
              </Button>
            </div>
          </div>
          
          {details.map((d, i) => {
            const availableBatches = batches.filter((b: any) => {
              const isSameProduct = b.produk_id.toString() === String(d.produk_id);
              const hasStock = b.stok_gudang > 0 && !b.is_deleted;
              const isExpired = new Date(b.expired_date) < new Date();
              return isSameProduct && hasStock && (onlyExpired ? isExpired : true);
            });

            const selectedBatch = batches.find((b: any) => b.id === d.batch_id);
            const maxStock = selectedBatch ? selectedBatch.stok_gudang : 1;

            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md w-full min-w-0 border">
                
                <div className="md:col-span-5">
                  <FormField label="Produk" htmlFor={`produk-${i}`} required>
                    <SelectInput id={`produk-${i}`} options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} value={d.produk_id ? String(d.produk_id) : ""} onValueChange={(val) => handleDetailChange(i, "produk_id", Number(val))} />
                  </FormField>
                </div>

                <div className="md:col-span-4">
                  <FormField label="Pilih Batch" htmlFor={`batch-${i}`} required>
                    <SelectInput 
                      id={`batch-${i}`}
                      options={availableBatches.map((b: any) => {
                        const isExp = new Date(b.expired_date) < new Date();
                        return { value: String(b.id), label: `${b.no_batch} (ED: ${new Date(b.expired_date).toLocaleDateString('id-ID')}) ${isExp ? '⚠️ Expired' : ''}` };
                      })} 
                      value={d.batch_id ? String(d.batch_id) : ""}
                      onValueChange={(val) => handleDetailChange(i, "batch_id", Number(val))}
                      placeholder={availableBatches.length === 0 ? "Tidak ada batch valid" : "Pilih Batch"}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Qty" htmlFor={`qty-${i}`} required>
                    <Input 
                      id={`qty-${i}`} 
                      type="number" 
                      min={1} 
                      max={maxStock}
                      value={d.qty_dimusnahkan} 
                      onChange={(e) => handleDetailChange(i, "qty_dimusnahkan", Number(e.target.value))} 
                    />
                  </FormField>
                  {selectedBatch && (
                    <p className={`text-[10px] mt-1 ${d.qty_dimusnahkan! > maxStock ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                      Maks: {maxStock} pcs
                    </p>
                  )}
                </div>

                <div className="md:col-span-1 flex justify-end pt-6">
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* RINGKASAN TOTAL */}
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" /> Total Pemusnahan:
          </div>
          <div className="flex gap-4">
            <span className="text-sm font-medium">{totalBatch} Batch</span>
            <span className="text-xl font-bold text-destructive">{totalQty} Pcs</span>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t mt-2 z-10">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" variant="destructive" disabled={create.isPending || details.length === 0}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {create.isPending ? "Memproses…" : "Periksa & Proses Disposal"}
          </Button>
        </DialogFooter>
      </form>

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi Pemusnahan Barang"
        description={`Anda akan memusnahkan ${totalQty} Pcs barang dari ${totalBatch} batch. Stok gudang akan dikurangi secara permanen. Lanjutkan?`}
        confirmLabel="Ya, Musnahkan"
        destructive={true}
        isPending={create.isPending}
        onConfirm={processDisposal}
      />
    </Modal>
  );
}