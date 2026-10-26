import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateSettlement } from "../hooks/useSettlement";
import { usePlans } from "@/plan/hooks/usePlan";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SettlementForm({ open, onOpenChange }: Props) {
  const create = useCreateSettlement();
  const { data: planResponse } = usePlans();
  
  const activePlans = ((planResponse as any)?.items || []).filter(
    (p: any) => p.status === "DISETUJUI" || p.status === "SETTLED"
  );

  const [planId, setPlanId] = useState("");
  const [tunai, setTunai] = useState(0);
  const [kasbon, setKasbon] = useState(0);
  const [fisik, setFisik] = useState(0);

  const estimasiSelisih = fisik - (tunai - kasbon);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!planId) return toast.error("Pilih Rencana Kanvas!");

    create.mutate({
      sales_kanvas_plan_id: Number(planId),
      total_penjualan_tunai: Number(fd.get("total_penjualan_tunai")),
      total_piutang_baru: Number(fd.get("total_piutang_baru")),
      total_kasbon_realisasi: Number(fd.get("total_kasbon_realisasi")),
      uang_fisik_diterima: Number(fd.get("uang_fisik_diterima")),
      status: "Closed",
    }, {
      onSuccess: () => {
        toast.success("Settlement berhasil ditutup!");
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Gagal Settlement", { description: error.response?.data?.message || error.message });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Form Settlement (Totalan)" className="max-w-xl">
      <form onSubmit={onSubmit} className="grid gap-4">
        
        <FormField label="Pilih Rencana Kanvas" htmlFor="plan_id" required>
          <SelectInput 
            id="plan_id" required 
            options={activePlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))} 
            value={planId} onValueChange={setPlanId}
            placeholder="Pilih Plan"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Total Penjualan Tunai (Rp)" htmlFor="total_penjualan_tunai" required>
            <Input id="total_penjualan_tunai" name="total_penjualan_tunai" type="number" required min={0} 
              onChange={(e) => setTunai(Number(e.target.value))} />
          </FormField>

          <FormField label="Total Kasbon Realisasi (Rp)" htmlFor="total_kasbon_realisasi" required>
            <Input id="total_kasbon_realisasi" name="total_kasbon_realisasi" type="number" required min={0} 
              onChange={(e) => setKasbon(Number(e.target.value))} />
          </FormField>

          <FormField label="Total Piutang Baru (Rp)" htmlFor="total_piutang_baru" required>
            <Input id="total_piutang_baru" name="total_piutang_baru" type="number" required min={0} />
          </FormField>

          <FormField label="Uang Fisik Diterima (Rp)" htmlFor="uang_fisik_diterima" required>
            <Input id="uang_fisik_diterima" name="uang_fisik_diterima" type="number" required 
              onChange={(e) => setFisik(Number(e.target.value))} />
          </FormField>
        </div>

        <div className="bg-muted p-4 rounded-md border flex justify-between items-center">
          <span className="font-semibold text-sm">Estimasi Selisih Kas:</span>
          <span className={`text-lg font-bold ${estimasiSelisih < 0 ? 'text-destructive' : 'text-green-600'}`}>
            Rp {estimasiSelisih.toLocaleString('id-ID')}
          </span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Tutup Settlement"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}