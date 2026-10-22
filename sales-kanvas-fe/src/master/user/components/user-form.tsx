import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { bool, fieldErrors, num, text, textOrNull, type FieldErrors } from "@/lib/form";
import { useSaveUser } from "../hooks/useUser";
import { useEmployees } from "../../employee/hooks/useEmployee";
import { useRoles } from "../../role/hooks/useRole";
import type { User } from "../types/user.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

export function UserForm({ open, onOpenChange, user }: Props) {
  const save = useSaveUser();
  const { data: employees = [] } = useEmployees();
  const { data: roles = [] } = useRoles();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleOpenChange = (o: boolean) => {
    if (!o) setErrors({});
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    
    const roleId = num(fd, "role_id");
    const empId = num(fd, "karyawan_id");

    if (!roleId || !empId) {
      toast.error("Karyawan dan Role wajib dipilih.");
      return;
    }

    const payload: any = {
      id: user?.id,
      name: text(fd, "name"),
      username: text(fd, "username"),
      karyawan_id: empId,
      role_id: roleId,
      is_active: bool(fd, "is_active"),
    };

    const pwd = textOrNull(fd, "password");
    if (pwd) payload.password = pwd;

    save.mutate(payload, {
      onSuccess: () => {   
        handleOpenChange(false);
      },
      onError: (err: any) => { 
        setErrors(fieldErrors(err));
      },
    });
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={user ? "Ubah User" : "Tambah User"} className="sm:max-w-lg">
      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Nama Lengkap" htmlFor="name" required error={errors.name}>
          <Input id="name" name="name" required autoFocus defaultValue={user?.name || ""} />
        </FormField>
        <FormField label="Username" htmlFor="username" required error={errors.username}>
          <Input id="username" name="username" required defaultValue={user?.username || ""} />
        </FormField>
        <FormField label="Password" htmlFor="password" hint={user ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"} error={errors.password}>
          <Input id="password" name="password" type="password" required={!user} />
        </FormField>
        
        <FormField label="Karyawan" htmlFor="karyawan_id" required error={errors.karyawan_id}>
          <SelectInput 
            id="karyawan_id" 
            name="karyawan_id" 
            required 
            options={employees.map(e => ({ value: String(e.id), label: e.name }))} 
            defaultValue={user?.karyawan_id ? String(user.karyawan_id) : undefined} 
          />
        </FormField>
        
        <FormField label="Role" htmlFor="role_id" required error={errors.role_id}>
          <SelectInput 
            id="role_id" 
            name="role_id" 
            required 
            options={roles.map(r => ({ value: String(r.id), label: r.name }))} 
            defaultValue={user?.role_id ? String(user.role_id) : undefined} 
          />
        </FormField>
        
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={user?.is_active ?? true} className="size-4 accent-primary" />
          Aktif
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}