import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { errorMessage } from "@/lib/errors";
import { fieldErrors, text, type FieldErrors } from "@/lib/form";
import { useSaveVehicle } from "../hooks/useVehicle";
import type { Vehicle } from "../types/vehicle.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
};

const VEHICLE_TYPES = ["Truk", "Pick Up", "Box", "Bus", "Mobil"];
const FUEL_TYPES = ["Solar", "Bensin"];

export function VehicleForm({ open, onOpenChange, vehicle }: Props) {
  const save = useSaveVehicle();
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
      {
        id: vehicle?.id,
        name: text(fd, "name"),
        nopol: text(fd, "nopol").toUpperCase(),
        type_vehicle: text(fd, "type_vehicle"),
        type_fuel: text(fd, "type_fuel"),
      },
      {
        onSuccess: () => {
          toast.success(
            vehicle ? "Kendaraan diperbarui" : "Kendaraan ditambahkan",
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
      title={vehicle ? "Ubah Kendaraan" : "Tambah Kendaraan"}
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nama" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            required
            autoFocus
            defaultValue={vehicle?.name}
            aria-invalid={!!errors.name}
          />
        </FormField>
        <FormField
          label="No. Polisi"
          htmlFor="nopol"
          required
          error={errors.nopol}
        >
          <Input
            id="nopol"
            name="nopol"
            required
            placeholder="K 1234 AB"
            className="uppercase"
            defaultValue={vehicle?.nopol}
            aria-invalid={!!errors.nopol}
          />
        </FormField>
        <FormField
          label="Jenis Kendaraan"
          htmlFor="type_vehicle"
          required
          error={errors.type_vehicle}
        >
          <Input
            id="type_vehicle"
            name="type_vehicle"
            list="vehicle-types"
            required
            defaultValue={vehicle?.type_vehicle}
            aria-invalid={!!errors.type_vehicle}
          />
          <datalist id="vehicle-types">
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </FormField>
        <FormField
          label="Bahan Bakar"
          htmlFor="type_fuel"
          required
          error={errors.type_fuel}
        >
          <Input
            id="type_fuel"
            name="type_fuel"
            list="fuel-types"
            required
            defaultValue={vehicle?.type_fuel}
            aria-invalid={!!errors.type_fuel}
          />
          <datalist id="fuel-types">
            {FUEL_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </FormField>
        <DialogFooter className="sm:col-span-2">
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
