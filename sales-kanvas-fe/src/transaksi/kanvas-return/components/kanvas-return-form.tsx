import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateKanvasReturn } from "../hooks/useKanvasReturn";
import { usePlan, usePlans } from "@/plan/hooks/usePlan"; // <-- Import usePlan
import { useGudang } from "@/master/gudang/hooks/useGudang";
import type { DetailKanvasReturnPayload } from "../types/kanvas-return.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

// Tipe data internal untuk UI
type DisplayRow = DetailKanvasReturnPayload & { 
  produk_name: string; 
  no_batch: string; 
  alasan?: string 
};

export function KanvasReturnForm({ open, onOpenChange }: Props) {
  const create = useCreateKanvasReturn();
  
  const { data: planResponse } = usePlans();
  const approvedPlans = ((planResponse as any)?.items || []).filter((p: any) => p.status === "DISETUJUI");
  
  const { data: gudangResponse } = useGudang();
  const gudangs = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);

  const [planId, setPlanId] = useState("");
  const [details, setDetails] = useState<DisplayRow[]>([]);

  // Tarik detail Plan
  const { data: planDetail, isLoading: isLoadingPlan } = usePlan(Number(planId) || 0);

  // === LOGIKA AUTO-FILL SISA BARANG BERDASARKAN BATCH ===
  useEffect(() => {
    if (!planDetail) {
      setDetails([]);
      return;
    }

    // 1. Map untuk menyimpan stok per batch_id
    // Format: batch_id -> { produk_id, no_batch, produk_name, qty }
    const batchMap = new Map<number, DisplayRow>();

    // 2. Kumpulkan Barang Keluar (Onloading)
    planDetail.kasbonProduks?.forEach((bon: any) => {
      bon.produkOuts?.forEach((po: any) => {
        po.detailProdukOuts?.forEach((d: any) => {
          const existing = batchMap.get(d.batch_id) || {
            batch_id: d.batch_id,
            produk_id: d.produk_id,
            qty: 0,
            kondisi: "BAGUS" as const,
            produk_name: d.produk?.name || "-",
            no_batch: d.batch?.no_batch || "-",
          };
          existing.qty += d.qty;
          batchMap.set(d.batch_id, existing);
        });
      });
    });

    // 3. Kurangi dengan Barang Terjual (Invoice)
    planDetail.invoiceOutlets?.forEach((inv: any) => {
      inv.detailInvoiceOutlets?.forEach((d: any) => {
        if (batchMap.has(d.batch_id)) {
          batchMap.get(d.batch_id)!.qty -= d.qty;
        }
      });
    });

    // 4. Kurangi dengan yang sudah pernah diretur (jika ada)
    planDetail.kanvasReturns?.forEach((kr: any) => {
      kr.details?.forEach((d: any) => {
        if (batchMap.has(d.batch_id)) {
          batchMap.get(d.batch_id)!.qty -= d.qty;
        }
      });
    });

    // 5. Filter hanya yang sisanya > 0
    const sisaBarang = Array.from(batchMap.values()).filter((b) => b.qty > 0);
    setDetails(sisaBarang);

  }, [planDetail]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setPlanId("");
      setDetails([]);
    }
    onOpenChange(o);
  };

  const updateDetail = (index: number, field: keyof DisplayRow, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (!planId) return toast.error("Pilih Plan terlebih dahulu!");
    if (details.length === 0) return toast.error("Tidak ada barang sisa untuk diretur.");

    // Validasi Alasan jika kondisi Rusak/Expired
    const missingAlasan = details.some(d => d.kondisi !== "BAGUS" && !d.alasan);
    if (missingAlasan) {
      return toast.error("Alasan wajib diisi untuk barang RUSAK atau EXPIRED!");
    }

    create.mutate({
      sales_kanvas_plan_id: Number(planId),
      gudang_tujuan_id: Number(fd.get("gudang_tujuan_id")),
      tgl_retur: new Date(fd.get("tgl_retur") as string).toISOString(),
      details: details.map(d => ({
        batch_id: d.batch_id,
        produk_id: d.produk_id,
        qty: d.qty,
        kondisi: d.kondisi,
        alasan: d.alasan || undefined,
      })),
    }, {
      onSuccess: () => {
        toast.success("Retur Kanvas berhasil disimpan!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || error.message;
        toast.error("Gagal Retur", { description: Array.isArray(msg) ? msg[0].message : msg });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Input Retur dari Sales" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-2 pb-4">
        
        {/* HEADER FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20 w-full min-w-0">
          <FormField label="Pilih Plan" htmlFor="sales_kanvas_plan_id" required>
            <SelectInput 
              id="sales_kanvas_plan_id" 
              name="sales_kanvas_plan_id" 
              required 
              options={approvedPlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))} 
              value={planId}
              onValueChange={setPlanId}
              placeholder="Pilih Plan" 
            />
          </FormField>
          <FormField label="Gudang Retur" htmlFor="gudang_tujuan_id" required>
            <SelectInput id="gudang_tujuan_id" name="gudang_tujuan_id" required options={gudangs.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang" />
          </FormField>
          <FormField label="Tanggal Retur" htmlFor="tgl_retur" required>
            <Input id="tgl_retur" name="tgl_retur" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
        </div>

        {/* TABEL AUTO-FILL */}
        <div className="border p-4 rounded-lg bg-card space-y-4 w-full min-w-0">
          <div className="flex flex-col border-b pb-2">
            <h3 className="font-semibold text-sm">Rincian Barang Sisa</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Info className="h-3 w-3" /> Sistem otomatis menghitung sisa barang berdasarkan data Onloading & Invoice.
            </p>
          </div>
          
          {isLoadingPlan && <p className="text-sm text-center text-muted-foreground py-4">Menghitung sisa barang...</p>}

          {!isLoadingPlan && details.length === 0 && planId && (
            <p className="text-sm text-center text-muted-foreground py-4">
              Tidak ada barang sisa. (Semua barang sudah terjual atau diretur).
            </p>
          )}

          {!isLoadingPlan && details.length > 0 && details.map((d, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md w-full min-w-0 border">
              
              {/* Produk (Read-only) */}
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground mb-1 block">Produk</label>
                <div className="font-medium text-sm pt-2 truncate" title={d.produk_name}>{d.produk_name}</div>
              </div>

              {/* Batch (Read-only) */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">No Batch</label>
                <div className="text-sm pt-2">{d.no_batch}</div>
              </div>

              {/* Qty (Read-only) */}
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                <div className="font-bold text-sm pt-2">{d.qty}</div>
              </div>

              {/* Kondisi (Dropdown) */}
              <div className="md:col-span-2">
                <FormField label="Kondisi" htmlFor={`kondisi-${i}`} required>
                  <SelectInput 
                    id={`kondisi-${i}`}
                    options={[
                      { value: "BAGUS", label: "Bagus" }, 
                      { value: "RUSAK", label: "Rusak" },
                      { value: "EXPIRED", label: "Expired" }
                    ]} 
                    value={d.kondisi}
                    onValueChange={(val: any) => updateDetail(i, "kondisi", val)}
                  />
                </FormField>
              </div>

              {/* Alasan (Muncul jika Rusak/Expired) */}
              <div className="md:col-span-3">
                {d.kondisi !== "BAGUS" ? (
                  <FormField label="Alasan" htmlFor={`alasan-${i}`} required>
                    <Input 
                      id={`alasan-${i}`} 
                      placeholder="Misal: Bocor, Pecah" 
                      value={d.alasan || ""} 
                      onChange={(e) => updateDetail(i, "alasan", e.target.value)} 
                    />
                  </FormField>
                ) : (
                  <div className="hidden md:block"></div> // Placeholder agar layout tetap rapi
                )}
              </div>

              {/* Tombol Hapus (Jika Gudang memilih tidak meretur item ini) */}
              <div className="md:col-span-1 flex justify-end pt-5">
                <Button type="button" variant="ghost" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>

            </div>
          ))}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t mt-2 z-10">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending || details.length === 0}>
            {create.isPending ? "Menyimpan…" : "Simpan Retur"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}