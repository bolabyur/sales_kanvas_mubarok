import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreatePembayaran } from "../hooks/usePembayaran";
import { useInvoices } from "@/transaksi/invoice/hooks/useInvoice"; 

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const TIPE_BAYAR = [
  { value: "Transfer", label: "Transfer Bank" },
  { value: "Tunai", label: "Tunai" },
];

const getLocalDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getErrorMessage = (err: any) => {
  if (err?.details && Array.isArray(err.details)) {
    return err.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
  }
  const msg = err.response?.data?.message || err.message;
  if (Array.isArray(msg)) return msg.map((m: any) => m.message || m).join(", ");
  if (typeof msg === "object") return JSON.stringify(msg);
  return msg || "Terjadi kesalahan";
};

export function PembayaranForm({ open, onOpenChange }: Props) {
  const create = useCreatePembayaran();
  const { data: invoices = [] } = useInvoices();

  const unpaidInvoices = invoices.filter((inv: any) => inv.kartuPiutangOutlet && Number(inv.kartuPiutangOutlet.sisa_piutang) > 0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [nominalBayar, setNominalBayar] = useState<number>(0);
  const selectedInvoice = unpaidInvoices.find((inv: any) => String(inv.id) === selectedInvoiceId);

  const addUang = (nominal: number) => setNominalBayar((prev) => prev + nominal);
  const handleUangPas = () => { if (selectedInvoice?.kartuPiutangOutlet?.sisa_piutang) setNominalBayar(Number(selectedInvoice.kartuPiutangOutlet.sisa_piutang)); };
  const handleOpenChange = (o: boolean) => { if (!o) { setSelectedInvoiceId(""); setNominalBayar(0); } onOpenChange(o); };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!selectedInvoiceId) return toast.error("Pilih Invoice!");
    if (nominalBayar <= 0) return toast.error("Masukkan nominal pembayaran!");

    create.mutate({
      invoice_outlet_id: Number(selectedInvoiceId),
      nominal_bayar: nominalBayar,
      tipe_bayar: fd.get("tipe_bayar") as string,
      tgl_bayar: new Date(fd.get("tgl_bayar") as string).toISOString(),
    }, {
      onSuccess: () => { toast.success("Pembayaran berhasil dicatat!"); handleOpenChange(false); },
      onError: (error: any) => {
        toast.error("Gagal Mencatat Pembayaran", {
          description: getErrorMessage(error),
        });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Catat Pembayaran Piutang" className="max-w-xl">
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Pilih Invoice (Belum Lunas)" htmlFor="invoice_id" required>
          <SelectInput 
            id="invoice_id" 
            required 
            options={unpaidInvoices.map((inv: any) => ({ 
              value: String(inv.id), 
              label: `INV #${inv.id} - ${inv.outlet?.nama_toko} (Sisa: Rp ${Number(inv.kartuPiutangOutlet.sisa_piutang).toLocaleString('id-ID')})` 
            }))} 
            value={selectedInvoiceId} 
            onValueChange={(val) => { setSelectedInvoiceId(val); setNominalBayar(0); }} 
            placeholder={unpaidInvoices.length === 0 ? "Tidak ada piutang" : "Pilih Invoice"} 
          />
        </FormField>

        {selectedInvoice && (
          <div className="bg-muted p-3 rounded-md text-sm border-l-4 border-primary">
            Total Tagihan: <strong>Rp {Number(selectedInvoice.total_tagihan).toLocaleString('id-ID')}</strong> <br/>
            Sisa Piutang: <strong className="text-destructive">Rp {Number(selectedInvoice.kartuPiutangOutlet.sisa_piutang).toLocaleString('id-ID')}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nominal Bayar (Rp)" htmlFor="nominal_bayar" required className="col-span-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
              <Input 
                id="nominal_bayar" 
                name="nominal_bayar" 
                type="text" 
                required 
                className="pl-10 text-lg font-semibold" 
                placeholder="0" 
                value={nominalBayar ? new Intl.NumberFormat("id-ID").format(nominalBayar) : ""} 
                onChange={(e) => setNominalBayar(Number(e.target.value.replace(/\D/g, "")))} 
              />
            </div>
          </FormField>

          {selectedInvoice && (
            <div className="col-span-2 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addUang(100000)}>+100rb</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addUang(50000)}>+50rb</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addUang(20000)}>+20rb</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addUang(10000)}>+10rb</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleUangPas}>Uang Pas</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setNominalBayar(0)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">Reset</Button>
              </div>
            </div>
          )}

          <FormField label="Metode Bayar" htmlFor="tipe_bayar" required>
            <SelectInput id="tipe_bayar" name="tipe_bayar" required options={TIPE_BAYAR} placeholder="Pilih Metode" />
          </FormField>

          <FormField label="Tanggal Bayar" htmlFor="tgl_bayar" required>
            <Input id="tgl_bayar" name="tgl_bayar" type="datetime-local" required defaultValue={getLocalDateTime()} />
          </FormField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Simpan Pembayaran"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}