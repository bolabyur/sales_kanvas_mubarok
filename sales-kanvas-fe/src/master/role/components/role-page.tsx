import { useState, useEffect } from "react";
import { useRoles, useSaveRole, usePermissions, useDeleteRole } from "../hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Role } from "../types/role.types";

export function RolePage() {
  const { data: roles = [], isLoading: loadRoles } = useRoles();
  const { data: permissions = [], isLoading: loadPerms } = usePermissions();
  const save = useSaveRole();
  const remove = useDeleteRole();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissionRoles?.map(pr => pr.permission.id) || []);
      setNewRoleName(selectedRole.name);
    } else {
      setSelectedPermissions([]);
      setNewRoleName("");
    }
  }, [selectedRole]);

  const togglePermission = (id: number) => {
    setSelectedPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // FITUR BARU: Centang Semua per Modul
  const toggleModule = (modulePerms: any[]) => {
    const moduleIds = modulePerms.map(p => p.id);
    const isAllSelected = moduleIds.every(id => selectedPermissions.includes(id));
    
    if (isAllSelected) {
      // Jika sudah dicentang semua, hapus centangnya
      setSelectedPermissions(prev => prev.filter(id => !moduleIds.includes(id)));
    } else {
      // Jika belum, centang semua
      setSelectedPermissions(prev => [...new Set([...prev, ...moduleIds])]);
    }
  };

  const handleSave = () => {
    if (!newRoleName) return toast.error("Nama role tidak boleh kosong.");
    
    save.mutate({
      id: selectedRole?.id,
      name: newRoleName,
      permissionIds: selectedPermissions,
    }, {
      onSuccess: () => {
        if (!selectedRole) setSelectedRole(null);
      }
    });
  };

  // Pengelompokan Modul & Diurutkan Berdasarkan Abjad
  const groupedPermissions = permissions.reduce((acc, p) => {
    const [module] = p.name.split(":");
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedModules = Object.keys(groupedPermissions).sort();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* KOLOM KIRI: LIST ROLE */}
      <div className="md:col-span-1 border rounded-xl flex flex-col overflow-hidden bg-card">       
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-semibold">Daftar Role</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <Button 
            variant={selectedRole === null ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setSelectedRole(null)}
          >
            <Plus className="mr-2 h-4 w-4 text-primary" /> Buat Role Baru
          </Button>
          <div className="my-2 border-t" />
          {loadRoles ? <p className="text-sm p-2">Memuat...</p> : roles.map(r => (
            <div key={r.id} className="flex items-center group">
              <Button
                variant={selectedRole?.id === r.id ? "secondary" : "ghost"}
                className="flex-1 justify-start"
                onClick={() => setSelectedRole(r)}
              >
                {r.name}
              </Button>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-500" onClick={() => setDeleting(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* KOLOM KANAN: FORM EDIT ROLE & PERMISSIONS */}
      <div className="md:col-span-2 border rounded-xl flex flex-col overflow-hidden bg-card">
        <div className="p-4 border-b flex items-end gap-4 bg-muted/50">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Nama Role</label>
            <Input 
              value={newRoleName} 
              onChange={(e) => setNewRoleName(e.target.value)} 
              placeholder="Misal: Admin Gudang"
            />
          </div>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? "Menyimpan..." : "Simpan Role"}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loadPerms ? <p>Memuat permissions...</p> : (
            <div className="grid gap-6">
              {sortedModules.map((module) => {
                const perms = groupedPermissions[module];
                const isAllSelected = perms.every(p => selectedPermissions.includes(p.id));

                return (
                  <div key={module} className="space-y-2 bg-muted/20 p-4 rounded-lg border">
                    <div className="flex justify-between items-center border-b pb-2 mb-3">
                      <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">
                        Modul: {module}
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => toggleModule(perms)}
                      >
                        {isAllSelected ? "Batal Pilih Semua" : "Pilih Semua"}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-muted rounded transition-colors">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selectedPermissions.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                          />
                          <span>{p.name.split(":")[1]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog 
        open={!!deleting} 
        onOpenChange={(o) => !o && setDeleting(null)} 
        title="Hapus Role?" 
        description={`"${deleting?.name}" akan dihapus.`} 
        isPending={remove.isPending}
        onConfirm={() => 
          deleting && remove.mutate(deleting.id, { 
            onSuccess: () => {  
              setDeleting(null); 
              setSelectedRole(null); 
            } 
          })
        } 
      />
    </div>
  );
}