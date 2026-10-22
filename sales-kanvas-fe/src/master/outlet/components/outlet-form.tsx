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
import { useSaveOutlet } from "../hooks/useOutlet";
import { useTipeHarga } from "../../tipe-harga/hooks/useTipeHarga";
import type { Outlet } from "../types/outlet.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; outlet: Outlet | null; };

export function OutletForm({ open, onOpenChange, outlet }: Props) {
  const save = useSaveOutlet();
  const { data: tipeHargaList = [] } = useTipeHarga();
  const [errors, setErrors] = useState<FieldErrors>({});
  const handleOpenChange = (o: boolean) => { if (!o) setErrors({}); onOpenChange(o); };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    save.mutate(
      { id: outlet?.id, nama_toko: text(fd, "nama_toko"), alamat: text(fd, "alamat"), tipe_harga_id: num(fd, "tipe_harga_id") },
      { onSuccess: () => {; handleOpenChange(false); }, onError: (err) => { setErrors(fieldErrors(err)); toast.error(errorMessage(err)); } }
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={outlet ? "Ubah Outlet" : "Tambah Outlet"}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Nama Toko" htmlFor="nama_toko" required error={errors.nama_toko}>
          <Input id="nama_toko" name="nama_toko" required autoFocus defaultValue={outlet?.nama_toko} />
        </FormField>
        <FormField label="Alamat" htmlFor="alamat" error={errors.alamat}>
          <Input id="alamat" name="alamat" defaultValue={outlet?.alamat ?? ""} />
        </FormField>
        <FormField label="Tipe Harga" htmlFor="tipe_harga_id" required error={errors.tipe_harga_id}>
          <SelectInput id="tipe_harga_id" name="tipe_harga_id" required options={tipeHargaList.map(t => ({ value: String(t.id), label: t.nama_tipe }))} defaultValue={outlet?.tipe_harga_id.toString()} />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}