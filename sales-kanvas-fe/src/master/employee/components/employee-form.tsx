import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { errorMessage } from "@/lib/errors";
import { toDateInput } from "@/lib/format";
import {
  bool,
  fieldErrors,
  num,
  numOrNull,
  text,
  textOrNull,
  type FieldErrors,
} from "@/lib/form";
import { useSaveEmployee } from "../hooks/useEmployee";
import type { Employee, Gender } from "../types/employee.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
};

const GENDER_OPTIONS = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];

const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map(
  (a) => ({ value: a, label: a }),
);

const HARI_OPTIONS = [
  { value: "", label: "Tidak ada" },
  ...["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((h, i) => ({
    value: String(i),
    label: h,
  })),
];

const REF_FIELDS = [
  { name: "employee_position_id", label: "ID Jabatan", required: true },
  { name: "employee_job_id", label: "ID Pekerjaan", required: true },
  { name: "employee_contract_id", label: "ID Kontrak", required: true },
  { name: "devisi_id", label: "ID Divisi", required: true },
  { name: "tipe_upah_id", label: "ID Tipe Upah" },
  { name: "jam_kerja_id", label: "ID Jam Kerja" },
] as const;

export function EmployeeForm({ open, onOpenChange, employee }: Props) {
  const save = useSaveEmployee();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleOpenChange = (o: boolean) => {
    if (!o) setErrors({});
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});

    // PERBAIKAN: Pastikan tanggal valid ISO string
    const rawTglLahir = text(fd, "tgl_lahir");
    const rawTglMasuk = text(fd, "tgl_masuk");

    save.mutate(
      {
        id: employee?.id,
        name: text(fd, "name"),
        nip: textOrNull(fd, "nip"),
        pin_fingerprint: textOrNull(fd, "pin_fingerprint"),
        contact: textOrNull(fd, "contact"),
        address: textOrNull(fd, "address"),
        gender: text(fd, "gender") as Gender,
        agama: text(fd, "agama"),
        // Konversi ke ISO 8601 string lengkap
        tgl_lahir: rawTglLahir ? new Date(rawTglLahir).toISOString() : "", 
        tgl_masuk: rawTglMasuk ? new Date(rawTglMasuk).toISOString() : "",
        hari_libur_mingguan: numOrNull(fd, "hari_libur_mingguan"),
        employee_position_id: num(fd, "employee_position_id"),
        employee_job_id: num(fd, "employee_job_id"),
        employee_contract_id: num(fd, "employee_contract_id"),
        devisi_id: num(fd, "devisi_id"),
        tipe_upah_id: numOrNull(fd, "tipe_upah_id"),
        jam_kerja_id: numOrNull(fd, "jam_kerja_id"),
        is_active: bool(fd, "is_active"),
      },
      {
        onSuccess: () => {
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
      title={employee ? "Ubah Karyawan" : "Tambah Karyawan"}
      className="max-w-[95vw] md:max-w-5xl"
    >
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <div className="sm:col-span-3 mb-1">
            <h3 className="font-semibold text-sm">Informasi Pribadi</h3>
          </div>
          <FormField label="Nama Lengkap" htmlFor="name" required error={errors.name} className="sm:col-span-3">
            <Input id="name" name="name" required autoFocus defaultValue={employee?.name} aria-invalid={!!errors.name} />
          </FormField>
          <FormField label="NIP" htmlFor="nip" error={errors.nip}>
            <Input id="nip" name="nip" defaultValue={employee?.nip ?? ""} aria-invalid={!!errors.nip} />
          </FormField>
          <FormField label="Kontak / HP" htmlFor="contact" error={errors.contact}>
            <Input id="contact" name="contact" type="tel" defaultValue={employee?.contact ?? ""} aria-invalid={!!errors.contact} />
          </FormField>
          <FormField label="PIN Fingerprint" htmlFor="pin_fingerprint" error={errors.pin_fingerprint}>
            <Input id="pin_fingerprint" name="pin_fingerprint" defaultValue={employee?.pin_fingerprint ?? ""} aria-invalid={!!errors.pin_fingerprint} />
          </FormField>
          <FormField label="Jenis Kelamin" htmlFor="gender" required error={errors.gender}>
            <SelectInput id="gender" name="gender" required options={GENDER_OPTIONS} defaultValue={employee?.gender} aria-invalid={!!errors.gender} />
          </FormField>
          <FormField label="Agama" htmlFor="agama" required error={errors.agama}>
            <SelectInput id="agama" name="agama" required options={AGAMA_OPTIONS} defaultValue={employee?.agama} aria-invalid={!!errors.agama} />
          </FormField>
          <FormField label="Tanggal Lahir" htmlFor="tgl_lahir" required error={errors.tgl_lahir}>
            <Input id="tgl_lahir" name="tgl_lahir" type="date" required defaultValue={toDateInput(employee?.tgl_lahir)} aria-invalid={!!errors.tgl_lahir} />
          </FormField>
          <FormField label="Alamat Lengkap" htmlFor="address" error={errors.address} className="sm:col-span-3">
            <Textarea id="address" name="address" rows={2} defaultValue={employee?.address ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-card">
          <div className="sm:col-span-3 mb-1">
            <h3 className="font-semibold text-sm">Data Kepegawaian & Referensi</h3>
          </div>
          <FormField label="Tanggal Masuk" htmlFor="tgl_masuk" required error={errors.tgl_masuk}>
            <Input id="tgl_masuk" name="tgl_masuk" type="date" required defaultValue={toDateInput(employee?.tgl_masuk)} aria-invalid={!!errors.tgl_masuk} />
          </FormField>
          <FormField label="Libur Mingguan" htmlFor="hari_libur_mingguan" error={errors.hari_libur_mingguan}>
            <SelectInput
              id="hari_libur_mingguan"
              name="hari_libur_mingguan"
              placeholder="Tidak ada"
              options={HARI_OPTIONS}
              defaultValue={employee?.hari_libur_mingguan?.toString()}
            />
          </FormField>
          
          {REF_FIELDS.map((f) => (
            <FormField
              key={f.name}
              label={f.label}
              htmlFor={f.name}
              required={"required" in f}
              error={errors[f.name]}
            >
              <Input
                id={f.name}
                name={f.name}
                type="number"
                min={1}
                required={"required" in f}
                defaultValue={employee?.[f.name] ?? ""}
                aria-invalid={!!errors[f.name]}
              />
            </FormField>
          ))}
        </div>

        <div className="border p-4 rounded-lg bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Status Karyawan</h3>
            <p className="text-xs text-muted-foreground">Jika dinonaktifkan, karyawan tidak akan muncul di pilihan form lain.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={employee?.is_active ?? true}
              className="size-4 accent-primary"
            />
            Aktif
          </label>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Karyawan"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}