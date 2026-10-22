import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { fieldErrors, text, type FieldErrors } from "@/lib/form";
import { useSaveGudang } from "../hooks/useGudang";
import type { Gudang } from "../types/gudang.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; gudang: Gudang | null; };

export function GudangForm({ open, onOpenChange, gudang }: Props) {
  const save = useSaveGudang();
  const [errors, setErrors] = useState<FieldErrors>({});
  const handleOpenChange = (o: boolean) => { if (!o) setErrors({}); onOpenChange(o); };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    save.mutate(
      { id: gudang?.id, nama_gudang: text(fd, "nama_gudang"), tipe_gudang: text(fd, "tipe_gudang") },
      { onSuccess: () => { ; handleOpenChange(false); }, onError: (err) => { setErrors(fieldErrors(err)); } }
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={gudang ? "Ubah Gudang" : "Tambah Gudang"}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Nama Gudang" htmlFor="nama_gudang" required error={errors.nama_gudang}>
          <Input id="nama_gudang" name="nama_gudang" required autoFocus defaultValue={gudang?.nama_gudang} />
        </FormField>
        <FormField label="Tipe Gudang" htmlFor="tipe_gudang" required error={errors.tipe_gudang}>
          <SelectInput id="tipe_gudang" name="tipe_gudang" required options={[{ value: "Barang Jadi", label: "Barang Jadi" }, { value: "Retur", label: "Retur" }]} defaultValue={gudang?.tipe_gudang ?? "Barang Jadi"} />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}