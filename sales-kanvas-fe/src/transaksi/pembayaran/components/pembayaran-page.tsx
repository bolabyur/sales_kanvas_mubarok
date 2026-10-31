import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { Modal } from "@/components/shared/modal";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate, formatRupiah } from "@/lib/format";
import { usePembayarans } from "../hooks/usePembayaran";
import type { Pembayaran } from "../types/pembayaran.types";
import { PembayaranForm } from "./pembayaran-form";

const toTitleCase = (str: string) => {
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function PembayaranPage() {
  const { data = [], isLoading, isError } = usePembayarans();
  const canWrite = usePermission()("pembayaran:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Pembayaran | null>(null);

  const columns: ColumnDef<Pembayaran>[] = [
    { 
      accessorKey: "id", 
      header: "ID", 
      cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> 
    },
    { 
      accessorKey: "invoiceOutlet.outlet.nama_toko", 
      header: "Outlet", 
      cell: ({ row }) => row.original.invoiceOutlet?.outlet?.nama_toko || "-" 
    },
    { 
      accessorKey: "invoice_outlet_id", 
      header: "Ref Invoice", 
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-primary">INV #{row.original.invoice_outlet_id}</span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.invoiceOutlet?.salesKanvasPlan?.invoice || "-"}
          </span>
        </div>
      ) 
    },
    { 
      accessorKey: "tgl_bayar", 
      header: "Tanggal", 
      cell: ({ row }) => formatDate(row.original.tgl_bayar) 
    },
    { 
      accessorKey: "tipe_bayar", 
      header: "Metode", 
      cell: ({ row }) => toTitleCase(row.original.tipe_bayar) 
    },
    { 
      accessorKey: "nominal_bayar", 
      header: "Nominal", 
      cell: ({ row }) => <span className="font-bold">{formatRupiah(row.original.nominal_bayar)}</span> 
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput placeholder="Cari data pembayaran…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Catat Pembayaran
              </Button>
            )}
          </>
        }
      />
      
      {/* Form Input Pembayaran */}
      <PembayaranForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Modal Detail Pembayaran */}
      <Modal 
        open={!!selectedPayment} 
        onOpenChange={(o) => !o && setSelectedPayment(null)} 
        title="Detail Pembayaran"
        className="max-w-md"
      >
        {selectedPayment && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="text-muted-foreground col-span-1">ID Pembayaran</span>
              <span className="font-semibold col-span-2">#{selectedPayment.id}</span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="text-muted-foreground col-span-1">Ref Invoice</span>
              <span className="font-semibold col-span-2 text-primary">
                INV #{selectedPayment.invoice_outlet_id} 
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({selectedPayment.invoiceOutlet?.salesKanvasPlan?.invoice})
                </span>
              </span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="text-muted-foreground col-span-1">Outlet</span>
              <span className="font-semibold col-span-2">{selectedPayment.invoiceOutlet?.outlet?.nama_toko || "-"}</span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="text-muted-foreground col-span-1">Tanggal Bayar</span>
              <span className="font-semibold col-span-2">{formatDate(selectedPayment.tgl_bayar)}</span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="text-muted-foreground col-span-1">Metode</span>
              <span className="font-semibold col-span-2">{toTitleCase(selectedPayment.tipe_bayar)}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-muted-foreground col-span-1">Nominal</span>
              <span className="font-bold text-lg text-green-600 col-span-2">
                {formatRupiah(selectedPayment.nominal_bayar)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}