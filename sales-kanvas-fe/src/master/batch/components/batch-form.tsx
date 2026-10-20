import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { errorMessage } from "@/lib/errors";
import { fieldErrors, num, text, type FieldErrors } from "@/lib/form";
import { useSaveBatch } from "../hooks/useBatch";
import { useProducts } from "../../product/hooks/useProduct";
import type { Batch } from "../types/batch.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; batch: Batch | null; };

export function BatchForm({ open, onOpenChange, batch }: Props) {
  const save = useSaveBatch();
  const { data: products = [] } = useProducts();
  const [errors, setErrors] = useState<FieldErrors>({});
  const handleOpenChange = (o: boolean) => { if (!o) setErrors({}); onOpenChange(o); };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    save.mutate(
      { 
        id: batch?.id, 
        produk_id: num(fd, "produk_id"), 
        no_batch: text(fd, "no_batch"), 
        expired_date: new Date(text(fd, "expired_date")).toISOString(), 
        stok_gudang: num(fd, "stok_gudang") 
      },
      { onSuccess: () => { toast.success(batch ? "Batch diperbarui" : "Batch ditambahkan"); handleOpenChange(false); }, onError: (err) => { setErrors(fieldErrors(err)); toast.error(errorMessage(err)); } }
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={batch ? "Ubah Batch" : "Tambah Batch"}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Produk" htmlFor="produk_id" required error={errors.produk_id}>
          <SelectInput id="produk_id" name="produk_id" required options={products.map((p: any) => ({ value: String(p.id), label: p.name }))} defaultValue={batch?.produk_id.toString()} />
        </FormField>
        <FormField label="No Batch" htmlFor="no_batch" required error={errors.no_batch}>
          <Input id="no_batch" name="no_batch" required defaultValue={batch?.no_batch} />
        </FormField>
        <FormField label="Tanggal Expired" htmlFor="expired_date" required error={errors.expired_date}>
          <Input id="expired_date" name="expired_date" type="date" required defaultValue={batch?.expired_date ? batch.expired_date.split("T")[0] : ""} />
        </FormField>
        <FormField label="Stok Gudang" htmlFor="stok_gudang" required error={errors.stok_gudang}>
          <Input id="stok_gudang" name="stok_gudang" type="number" min={0} required defaultValue={batch?.stok_gudang ?? ""} />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}