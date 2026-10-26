import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate, formatRupiah } from "@/lib/format";
import { usePembayarans } from "../hooks/usePembayaran";
import type { Pembayaran } from "../types/pembayaran.types";
import { PembayaranForm } from "./pembayaran-form";

export function PembayaranPage() {
  const { data = [], isLoading, isError } = usePembayarans();
  const canWrite = usePermission()("pembayaran:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const columns: ColumnDef<Pembayaran>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "invoiceOutlet.outlet.nama_toko", header: "Outlet", cell: ({ row }) => row.original.invoiceOutlet?.outlet?.nama_toko || "-" },
    { accessorKey: "invoice_outlet_id", header: "Ref Invoice", cell: ({ row }) => `INV #${row.original.invoice_outlet_id}` },
    { accessorKey: "tgl_bayar", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tgl_bayar) },
    { accessorKey: "tipe_bayar", header: "Metode" },
    { accessorKey: "nominal_bayar", header: "Nominal", cell: ({ row }) => <span className="font-bold text-green-600">{formatRupiah(row.original.nominal_bayar)}</span> },
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
      <PembayaranForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}