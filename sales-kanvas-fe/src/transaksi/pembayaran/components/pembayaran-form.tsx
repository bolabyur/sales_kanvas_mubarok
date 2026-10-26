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
  { value: "TRANSFER", label: "Transfer Bank" },
  { value: "TUNAI", label: "Tunai" },
];

export function PembayaranForm({ open, onOpenChange }: Props) {
  const create = useCreatePembayaran();
  const { data: invoices = [] } = useInvoices();

  const unpaidInvoices = invoices.filter(
    (inv: any) => inv.kartuPiutangOutlet && Number(inv.kartuPiutangOutlet.sisa_piutang) > 0
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const selectedInvoice = unpaidInvoices.find((inv: any) => String(inv.id) === selectedInvoiceId);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!selectedInvoiceId) return toast.error("Pilih Invoice!");

    create.mutate({
      invoice_outlet_id: Number(selectedInvoiceId),
      nominal_bayar: Number(fd.get("nominal_bayar")),
      tipe_bayar: fd.get("tipe_bayar") as string,
      tgl_bayar: new Date(fd.get("tgl_bayar") as string).toISOString(),
    }, {
      onSuccess: () => {
        toast.success("Pembayaran berhasil dicatat!");
        onOpenChange(false);
        setSelectedInvoiceId("");
      },
      onError: (error: any) => {
        toast.error("Gagal Pembayaran", { description: error.response?.data?.message || error.message });
      }
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Catat Pembayaran Piutang" className="max-w-xl">
      <form onSubmit={onSubmit} className="grid gap-4">
        
        <FormField label="Pilih Invoice (Belum Lunas)" htmlFor="invoice_id" required>
          <SelectInput 
            id="invoice_id" required 
            options={unpaidInvoices.map((inv: any) => ({ 
              value: String(inv.id), 
              label: `INV #${inv.id} - ${inv.outlet?.nama_toko} (Sisa: Rp ${Number(inv.kartuPiutangOutlet.sisa_piutang).toLocaleString('id-ID')})` 
            }))} 
            value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}
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
          <FormField label="Nominal Bayar (Rp)" htmlFor="nominal_bayar" required>
            <Input id="nominal_bayar" name="nominal_bayar" type="number" required min={1} />
          </FormField>

          <FormField label="Metode Bayar" htmlFor="tipe_bayar" required>
            <SelectInput id="tipe_bayar" name="tipe_bayar" required options={TIPE_BAYAR} placeholder="Pilih Metode" />
          </FormField>

          <FormField label="Tanggal Bayar" htmlFor="tgl_bayar" required className="col-span-2">
            <Input id="tgl_bayar" name="tgl_bayar" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan…" : "Simpan Pembayaran"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}