import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { errorMessage } from "@/lib/errors";
import { fieldErrors, text, type FieldErrors } from "@/lib/form";
import { useSaveKasbonMaterialType } from "../hooks/useKasbonMaterialType";
import type { KasbonMaterialType } from "../types/kasbonMaterialType.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tambah baru */
  kasbonMaterialType: KasbonMaterialType | null;
};

export function KasbonMaterialTypeForm({
  open,
  onOpenChange,
  kasbonMaterialType,
}: Props) {
  const save = useSaveKasbonMaterialType();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleOpenChange = (o: boolean) => {
    if (!o) setErrors({});
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    save.mutate(
      { id: kasbonMaterialType?.id, name: text(fd, "name") },
      {
        onSuccess: () => {
          toast.success(
            kasbonMaterialType
              ? "Jenis kasbon diperbarui"
              : "Jenis kasbon ditambahkan",
          );
          handleOpenChange(false);
        },
        onError: (err) => {
          setErrors(fieldErrors(err));
          toast.error(errorMessage(err));
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={
        kasbonMaterialType
          ? "Ubah Jenis Kasbon Material"
          : "Tambah Jenis Kasbon Material"
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Nama" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            required
            autoFocus
            placeholder="mis. Solar, Tol, Parkir"
            defaultValue={kasbonMaterialType?.name}
            aria-invalid={!!errors.name}
          />
        </FormField>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
