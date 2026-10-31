import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, SlidersHorizontal } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useBatches, useDeleteBatch } from "../hooks/useBatch";
import type { Batch } from "../types/batch.types";
import { BatchForm } from "./batch-form";
import { BatchDetailModal } from "./batch-detail-modal"; 

const getDaysUntilExpired = (expiredDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiredDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export function BatchPage() {
  const { data = [], isLoading, isError } = useBatches();
  const remove = useDeleteBatch();
  const canWrite = usePermission()("batch:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState<Batch | null>(null);
  
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [hideZeroStock, setHideZeroStock] = useState(false);

  const openForm = (row: Batch | null) => { setEditing(row); setFormOpen(true); };

  const filteredData = useMemo(() => {
    let result = data;

    if (activeTab === "available") result = result.filter(b => b.stok_gudang > 0);
    else if (activeTab === "zero") result = result.filter(b => b.stok_gudang === 0);
    else if (activeTab === "near_expired") result = result.filter(b => {
      const days = getDaysUntilExpired(b.expired_date);
      return days >= 0 && days <= 90; 
    });
    else if (activeTab === "expired") result = result.filter(b => getDaysUntilExpired(b.expired_date) < 0);

    if (hideZeroStock && activeTab !== "zero") result = result.filter(b => b.stok_gudang > 0);

    return result;
  }, [data, activeTab, hideZeroStock]);

  const columns: ColumnDef<Batch>[] = [
    { 
      accessorKey: "no_batch", 
      header: "No Batch", 
      cell: ({ row }) => <span className="font-medium">{row.original.no_batch}</span> 
    },
    { 
      accessorKey: "produk.name", 
      header: "Produk", 
      cell: ({ row }) => row.original.produk?.name || "-" 
    },
    { 
      accessorKey: "expired_date", 
      header: "Expired", 
      cell: ({ row }) => {
        const days = getDaysUntilExpired(row.original.expired_date);
        if (days < 0) return <span className="text-destructive font-medium">{formatDate(row.original.expired_date)}</span>;
        if (days <= 90) return <span className="text-amber-600 font-medium">{formatDate(row.original.expired_date)}</span>;
        return <span className="text-muted-foreground">{formatDate(row.original.expired_date)}</span>;
      }
    },
    { 
      accessorKey: "stok_gudang", 
      header: () => <div className="text-right">Stok</div>,
      cell: ({ row }) => (
        <div className={`text-right font-medium ${row.original.stok_gudang === 0 ? "text-muted-foreground/50" : "text-foreground"}`}>
          {row.original.stok_gudang}
        </div>
      ) 
    },
    ...(canWrite ? [{ 
      id: "actions", 
      cell: ({ row }: any) => (
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => setDetailBatch(row.original)} 
            title="Detail & Koreksi Stok"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <RowActions onEdit={() => openForm(row.original)} onDelete={() => setDeleting(row.original)} /> 
        </div>
      )
    } satisfies ColumnDef<Batch>] : []),
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="available">Tersedia</TabsTrigger>
            <TabsTrigger value="zero">Stok 0</TabsTrigger>
            <TabsTrigger value="near_expired">ED Kritis</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Switch 
            id="hide-zero" 
            checked={hideZeroStock} 
            onCheckedChange={setHideZeroStock} 
          />
          <label htmlFor="hide-zero" className="text-sm text-muted-foreground cursor-pointer select-none">
            Sembunyikan Stok 0
          </label>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput placeholder="Cari no batch / produk…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && <Button className="ml-auto" onClick={() => openForm(null)}><Plus className="h-4 w-4 mr-2" /> Tambah</Button>}
          </>
        }
      />
      
      <BatchForm open={formOpen} onOpenChange={setFormOpen} batch={editing} />
      
      <BatchDetailModal 
        open={!!detailBatch} 
        onOpenChange={(o) => !o && setDetailBatch(null)} 
        batch={detailBatch} 
      />

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus Batch?" description={`"${deleting?.no_batch}" akan dihapus.`} isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => {setDeleting(null); },  })} />
    </>
  );
}