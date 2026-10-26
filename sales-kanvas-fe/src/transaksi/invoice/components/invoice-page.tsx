import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate, formatRupiah } from "@/lib/format";
import { useInvoices } from "../hooks/useInvoice";
import type { Invoice } from "../types/invoice.types";
import { InvoiceForm } from "./invoice-form";
import { InvoiceDetail } from "./invoice-detail";

export function InvoicePage() {
  const { data = [], isLoading, isError } = useInvoices();
  const canWrite = usePermission()("invoice:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<Invoice | null>(null);

  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "outlet.nama_toko", header: "Outlet", cell: ({ row }) => row.original.outlet?.nama_toko || "-" },
    { accessorKey: "tgl_invoice", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tgl_invoice) },
    { accessorKey: "total_tagihan", header: "Total Tagihan", cell: ({ row }) => <span className="font-bold">{formatRupiah(row.original.total_tagihan)}</span> },
    { 
      accessorKey: "tipe_pembayaran", 
      header: "Tipe", 
      cell: ({ row }) => <Badge variant={row.original.tipe_pembayaran.toUpperCase() === "TUNAI" ? "default" : "outline"}>{row.original.tipe_pembayaran}</Badge> 
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailData(row.original)}>
          <FileText className="h-4 w-4" />
        </Button>
      ),
    },
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
            <SearchInput placeholder="Cari invoice / outlet…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Buat Invoice
              </Button>
            )}
          </>
        }
      />
      <InvoiceForm open={formOpen} onOpenChange={setFormOpen} />
      <InvoiceDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}