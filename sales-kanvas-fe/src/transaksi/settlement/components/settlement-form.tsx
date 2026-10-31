import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateSettlement } from "../hooks/useSettlement";
import { usePlan, usePlans } from "@/plan/hooks/usePlan";
import { formatRupiah } from "@/lib/format";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SettlementForm({ open, onOpenChange }: Props) {
  const create = useCreateSettlement();
  
  const { data: planResponse } = usePlans();
  const planList = Array.isArray(planResponse) ? planResponse : ((planResponse as any)?.items || []);
  
  // ✅ Filter: Harus DISETUJUI dan Punya Invoice
  const activePlans = planList.filter((p: any) => {
    const isApproved = String(p.status).toUpperCase() === "DISETUJUI";  
    const hasInvoices = Array.isArray(p.invoiceOutlets) && p.invoiceOutlets.length > 0; 
    return isApproved && hasInvoices;
  });

  const [planId, setPlanId] = useState("");
  const [fisik, setFisik] = useState<number>(0);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const { data: planDetail, isLoading: isDetailLoading } = usePlan(Number(planId) || 0);

  const [tunai, setTunai] = useState(0);
  const [piutang, setPiutang] = useState(0);
  const [kasbon, setKasbon] = useState(0);

  useEffect(() => {
    if (planDetail) {
      const detail = planDetail as any;
      let t = 0, p = 0, k = 0;
      detail.invoiceOutlets?.forEach((inv: any) => {
        if (inv.tipe_pembayaran === "Tunai") t += Number(inv.total_tagihan);
        else p += Number(inv.total_tagihan);
      });
      detail.kasbonOperasionals?.forEach((op: any) => { k += Number(op.nominal_kasbon); });
      
      setTunai(t); 
      setPiutang(p); 
      setKasbon(k);

      // ✅ Otomatis isi uang fisik jika belum diubah manual
      if (!isAutoFilled) {
        setFisik(t + k);
        setIsAutoFilled(true);
      }
    } else {
      setTunai(0); setPiutang(0); setKasbon(0); setFisik(0);
      setIsAutoFilled(false);
    }
  }, [planDetail, isAutoFilled]);

  const uangSeharusnya = tunai + kasbon;
  const estimasiSelisih = fisik - uangSeharusnya;

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!planId) return toast.error("Pilih Rencana Kanvas!");

    let karyawanId = 1;
    try {
      const loggedUser = JSON.parse(localStorage.getItem("sk_user") || "{}");
      if (loggedUser?.karyawan_id) karyawanId = loggedUser.karyawan_id;
    } catch (e) {}

    create.mutate({
      sales_kanvas_plan_id: Number(planId),
      uang_fisik_diterima: fisik,
      approved_by: karyawanId,
    }, {
      onSuccess: () => {
        toast.success("Settlement berhasil ditutup!");
        onOpenChange(false);
        setPlanId(""); setFisik(0); setIsAutoFilled(false);
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || error.message;
        toast.error("Gagal Settlement", { description: Array.isArray(msg) ? msg[0].message : msg });
      }
    });
  }

  const handlePlanChange = (val: string) => {
    setPlanId(val);
    setIsAutoFilled(false);
  };

  const handleManualFisik = (val: number) => {
    setFisik(val);
    setIsAutoFilled(true);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Form Settlement (Totalan)" className="max-w-xl">
      <form onSubmit={onSubmit} className="grid gap-4">
        
        <FormField label="Pilih Rencana Kanvas" htmlFor="plan_id" required>
          <SelectInput 
            id="plan_id" 
            required 
            options={activePlans.map((p: any) => {
              const invoiceIds = p.invoiceOutlets?.map((inv: any) => `#${inv.id}`).join(", ");
              const tgl = new Date(p.tgl_pergi_kanvas).toLocaleDateString('id-ID');
              return { 
                value: String(p.id), 
                label: `${p.invoice} | ${tgl} | INV: ${invoiceIds || 'Belum ada'}` 
              };
            })} 
            value={planId} 
            onValueChange={handlePlanChange} 
            placeholder={activePlans.length === 0 ? "Tidak ada Plan siap disettle" : "Pilih Plan"} 
          />
        </FormField>

        {isDetailLoading && <p className="text-sm text-center text-muted-foreground animate-pulse">Memuat data transaksi...</p>}

        {planId && planDetail && !isDetailLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 bg-muted/30 p-4 rounded-md border text-center sm:text-left">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Penjualan Tunai</p>
                <p className="font-semibold text-sm">{formatRupiah(tunai)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Kasbon Realisasi</p>
                <p className="font-semibold text-sm">{formatRupiah(kasbon)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Piutang Baru</p>
                <p className="font-semibold text-sm text-orange-600">{formatRupiah(piutang)}</p>
              </div>
            </div>

            <FormField label="Uang Fisik Diterima (Rp)" htmlFor="uang_fisik_diterima" required>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                <Input 
                  id="uang_fisik_diterima" 
                  type="text" 
                  required 
                  className="pl-10 text-lg font-semibold" 
                  placeholder="0" 
                  value={fisik ? new Intl.NumberFormat("id-ID").format(fisik) : ""} 
                  onChange={(e) => handleManualFisik(Number(e.target.value.replace(/\D/g, "")))} 
                />
              </div>
            </FormField>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleManualFisik(fisik + 100000)}>+100rb</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleManualFisik(fisik + 50000)}>+50rb</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleManualFisik(fisik + 20000)}>+20rb</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleManualFisik(fisik + 10000)}>+10rb</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleManualFisik(fisik + 5000)}>+5rb</Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => handleManualFisik(0)}>Reset</Button>
            </div>

            <div className={`p-4 rounded-md border flex justify-between items-center transition-colors ${estimasiSelisih === 0 ? 'bg-green-50 border-green-200' : 'bg-destructive/10 border-destructive/20'}`}>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Estimasi Selisih Kas:</span>
                <span className="text-xs text-muted-foreground">(Uang Fisik - Total Seharusnya)</span>
              </div>
              <span className={`text-lg font-bold ${estimasiSelisih < 0 ? 'text-destructive' : estimasiSelisih > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatRupiah(estimasiSelisih)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending || !planId}>{create.isPending ? "Memproses…" : "Tutup Settlement"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}