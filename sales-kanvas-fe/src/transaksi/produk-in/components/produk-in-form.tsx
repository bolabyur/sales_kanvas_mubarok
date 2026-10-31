import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateProdukIn } from "../hooks/useProdukIn";
import { usePlan, usePlans } from "@/plan/hooks/usePlan"; 
import { useProducts } from "@/master/product/hooks/useProduct";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import type { TipeSumberIn, DetailProdukInPayload } from "../types/produk-in.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const TIPE_SUMBER_OPTIONS = [
  { value: "SALES_KANVAS", label: "Dari Sales Kanvas" },
  { value: "PRODUKSI", label: "Dari Produksi" },
  { value: "RETUR", label: "Dari Retur" },
  { value: "SHOWROOM", label: "Dari Showroom" },
  { value: "TOKO", label: "Dari Toko" },
];

export function ProdukInForm({ open, onOpenChange }: Props) {
  const create = useCreateProdukIn();
  
  const { data: planResponse } = usePlans();
  const approvedPlans = (planResponse?.items || []).filter((p: any) => p.status === "DISETUJUI");
  
  const { data: products = [] } = useProducts();
  const { data: gudangList = [] } = useGudang();

  const [planId, setPlanId] = useState(""); 
  const [details, setDetails] = useState<Partial<DetailProdukInPayload>[]>([
    { produk_id: undefined, no_batch: "", expired_date: "", qty_sisa: 1, kondisi: "Bagus" }
  ]);

  const { data: planDetail } = usePlan(Number(planId) || 0);

  useEffect(() => {
    if (!planDetail) return;

    const onloadedMap = new Map<number, number>(); 
    planDetail.kasbonProduks?.forEach((bon: any) => {
      bon.detailKasbonProduks?.forEach((detail: any) => {
        const current = onloadedMap.get(detail.produk_id) || 0;
        onloadedMap.set(detail.produk_id, current + detail.qty_bawa);
      });
    });

    const soldMap = new Map<number, number>();
    planDetail.invoiceOutlets?.forEach((inv: any) => {
      inv.detailInvoiceOutlets?.forEach((detail: any) => {
        const current = soldMap.get(detail.produk_id) || 0;
        soldMap.set(detail.produk_id, current + detail.qty);
      });
    });

    const expectedLeftovers: Partial<DetailProdukInPayload>[] = [];
    onloadedMap.forEach((onloadedQty, produkId) => {
      const soldQty = soldMap.get(produkId) || 0;
      const sisa = onloadedQty - soldQty;

      if (sisa > 0) {
        expectedLeftovers.push({
          produk_id: produkId,
          qty_sisa: sisa,
          no_batch: "",
          expired_date: "",
          kondisi: "Bagus",
        });
      }
    });

    if (expectedLeftovers.length > 0) {
      setDetails(expectedLeftovers);
      toast.info(`Sistem otomatis mengisi ${expectedLeftovers.length} sisa barang dari Plan ini.`);
    } else {
      setDetails([{ produk_id: undefined, no_batch: "", expired_date: "", qty_sisa: 1, kondisi: "Bagus" }]);
      toast.info("Tidak ada sisa barang yang perlu dikembalikan (semua terjual).");
    }

  }, [planDetail]); 

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setDetails([{ produk_id: undefined, no_batch: "", expired_date: "", qty_sisa: 1, kondisi: "Bagus" }]);
      setPlanId("");
    }
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (details.some(d => !d.produk_id || !d.no_batch || !d.expired_date)) {
      return toast.error("Lengkapi No Batch dan Tgl Expired untuk semua barang!");
    }

    create.mutate({
      sales_kanvas_plan_id: Number(fd.get("sales_kanvas_plan_id")),
      gudang_id: Number(fd.get("gudang_id")),
      tgl_masuk: new Date(fd.get("tgl_masuk") as string).toISOString(),
      source_type: fd.get("source_type") as TipeSumberIn,
      details: details as DetailProdukInPayload[],
    }, {
      onSuccess: () => {
        toast.success("Unloading berhasil disimpan!");
        handleOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal Unloading", {
          description: error.response?.data?.message || error.message,
        });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Proses Unloading (Produk In)" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border p-4 rounded-lg bg-muted/20 w-full min-w-0">
          <FormField label="Pilih Plan (Disetujui)" htmlFor="sales_kanvas_plan_id" required>
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
          <FormField label="Pilih Gudang" htmlFor="gudang_id" required>
            <SelectInput id="gudang_id" name="gudang_id" required options={gudangList.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} placeholder="Pilih Gudang" />
          </FormField>
          <FormField label="Tanggal Masuk" htmlFor="tgl_masuk" required>
            <Input id="tgl_masuk" name="tgl_masuk" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
          <FormField label="Sumber Barang" htmlFor="source_type" required>
            <SelectInput id="source_type" name="source_type" required options={TIPE_SUMBER_OPTIONS} defaultValue="SALES_KANVAS" />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h3 className="font-semibold text-sm">Detail Barang Sisa</h3>
              <p className="text-xs text-muted-foreground">Pastikan No Batch dan ED sesuai dengan fisik yang dikembalikan.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { produk_id: undefined, no_batch: "", expired_date: "", qty_sisa: 1, kondisi: "Bagus" }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris Manual
            </Button>
          </div>
          
          {details.map((d, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-muted/10 p-3 rounded-md w-full min-w-0">
              <FormField label="Produk" htmlFor={`produk_id-${i}`} required className="md:col-span-2">
                <SelectInput 
                  id={`produk_id-${i}`} 
                  options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} 
                  value={d.produk_id ? String(d.produk_id) : ""} 
                  onValueChange={(val) => { const newD = [...details]; newD[i].produk_id = Number(val); setDetails(newD); }} 
                />
              </FormField>
              <FormField label="No Batch" htmlFor={`no_batch-${i}`} required>
                <Input id={`no_batch-${i}`} placeholder="Sesuai fisik" value={d.no_batch} onChange={(e) => { const newD = [...details]; newD[i].no_batch = e.target.value; setDetails(newD); }} />
              </FormField>
              <FormField label="Tgl Expired" htmlFor={`expired_date-${i}`} required>
                <Input id={`expired_date-${i}`} type="date" value={d.expired_date ? d.expired_date.slice(0, 10) : ""} onChange={(e) => { const newD = [...details]; newD[i].expired_date = new Date(e.target.value).toISOString(); setDetails(newD); }} />
              </FormField>
              <FormField label="Qty Sisa" htmlFor={`qty_sisa-${i}`} required>
                <Input id={`qty_sisa-${i}`} type="number" min={1} value={d.qty_sisa} onChange={(e) => { const newD = [...details]; newD[i].qty_sisa = Number(e.target.value); setDetails(newD); }} />
              </FormField>
              <div className="flex items-end gap-2">
                <FormField label="Kondisi" htmlFor={`kondisi-${i}`} required className="flex-1">
                  <SelectInput id={`kondisi-${i}`} options={[{ value: "Bagus", label: "Bagus" }, { value: "Rusak", label: "Rusak" }]} value={d.kondisi} onValueChange={(val: any) => { const newD = [...details]; newD[i].kondisi = val; setDetails(newD); }} />
                </FormField>
                <Button type="button" variant="destructive" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Memproses…" : "Proses Unloading"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}