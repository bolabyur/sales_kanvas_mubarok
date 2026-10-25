import { type SubmitEvent } from "react"; // <-- PERBAIKAN: Hapus useState
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateProdukOut } from "../hooks/useProdukOut";
import { useKasbonProduks } from "@/transaksi/kasbon-produk/hooks/useKasbonProduk";
import { useGudang } from "@/master/gudang/hooks/useGudang";
import type { TipeSumberOut } from "../types/produk-out.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const TIPE_SUMBER_OPTIONS = [
  { value: "KE_SALES_KANVAS", label: "Ke Sales Kanvas" },
  { value: "KE_PENJUALAN", label: "Ke Penjualan" },
  { value: "KE_SALES_COUNTER", label: "Ke Sales Counter" },
  { value: "KE_SHOWROOM", label: "Ke Showroom" },
];

export function ProdukOutForm({ open, onOpenChange }: Props) {
  const create = useCreateProdukOut();
  const { data: bonList = [] } = useKasbonProduks();
  const pendingBons = bonList.filter((b: any) => b.status === "PENDING");
  const { data: gudangList = [] } = useGudang(); 

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    create.mutate({
      kasbon_produk_id: Number(fd.get("kasbon_produk_id")),
      gudang_id: Number(fd.get("gudang_id")),
      tgl_keluar: new Date(fd.get("tgl_keluar") as string).toISOString(),
      tipe_sumber: fd.get("tipe_sumber") as TipeSumberOut,
    }, {
      onSuccess: () => {
        toast.success("Loading berhasil diproses!");
        handleOpenChange(false);
      },
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Proses Loading (Produk Out)" className="max-w-2xl">
      <form onSubmit={onSubmit} className="grid gap-6 p-1">
        <div className="grid gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Pilih BON (Pending)" htmlFor="kasbon_produk_id" required>
            <SelectInput 
              id="kasbon_produk_id" 
              name="kasbon_produk_id" 
              required 
              options={pendingBons.map((b: any) => ({ value: String(b.id), label: `BON #${b.id} - ${b.salesKanvasPlan?.invoice}` }))} 
              placeholder={pendingBons.length === 0 ? "Tidak ada BON Pending" : "Pilih BON"}
            />
          </FormField>

          <FormField label="Pilih Gudang" htmlFor="gudang_id" required>
            <SelectInput 
              id="gudang_id" 
              name="gudang_id" 
              required 
              options={gudangList.map((g: any) => ({ value: String(g.id), label: g.nama_gudang }))} 
              placeholder="Pilih Gudang"
            />
          </FormField>

          <FormField label="Tanggal Keluar" htmlFor="tgl_keluar" required>
            <Input id="tgl_keluar" name="tgl_keluar" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </FormField>

          <FormField label="Sumber Pengeluaran" htmlFor="tipe_sumber" required>
            <SelectInput id="tipe_sumber" name="tipe_sumber" required options={TIPE_SUMBER_OPTIONS} placeholder="Pilih Tipe Sumber" />
          </FormField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Memproses…" : "Proses Loading"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}