import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Wallet, TrendingUp, HandCoins, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatRupiah } from "@/lib/format"; 
import { useSettlements } from "../hooks/useSettlement";
import type { Settlement } from "../types/settlement.types";
import { SettlementForm } from "./settlement-form";

const toTitleCase = (str: string) => {
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function SettlementPage() {
  const { data: response, isLoading, isError } = useSettlements();
  const data = response?.data || []; 

  const canWrite = usePermission()("settlement:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // === PERHITUNGAN RINGKASAN KEUANGAN ===
  const totalTunai = data.reduce((sum, item) => sum + Number(item.total_penjualan_tunai), 0);
  const totalKasbon = data.reduce((sum, item) => sum + Number(item.total_kasbon_realisasi), 0);
  const totalPiutang = data.reduce((sum, item) => sum + Number(item.total_piutang_baru), 0);
  const totalSelisih = data.reduce((sum, item) => sum + Number(item.selisih_kas), 0);

  const columns: ColumnDef<Settlement>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "salesKanvasPlan.invoice", header: "Rencana Kanvas", cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-" },
    { accessorKey: "total_penjualan_tunai", header: "Penjualan Tunai", cell: ({ row }) => formatRupiah(row.original.total_penjualan_tunai) },
    { 
      accessorKey: "selisih_kas", 
      header: "Selisih Kas", 
      cell: ({ row }) => {
        const selisih = Number(row.original.selisih_kas);
        let colorClass = "font-bold text-muted-foreground";
        if (selisih > 0) colorClass = "font-bold text-emerald-600";
        if (selisih < 0) colorClass = "font-bold text-destructive";
        
        return <span className={colorClass}>{formatRupiah(selisih)}</span>
      } 
    },
    { 
      accessorKey: "status", 
      header: "Status", 
      cell: ({ row }) => {
        const status = toTitleCase(row.original.status);
        return <Badge variant={status === "Closed" ? "default" : "secondary"}>{status}</Badge>;
      } 
    },
  ];

  return (
    <div className="space-y-6">
      {/* === KARTU RINGKASAN KEUANGAN (SHADCN STYLE) === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan Tunai</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatRupiah(totalTunai)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kasbon Operasional</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Warna dihilangkan, jadi hitam netral */}
            <div className="text-2xl font-bold tracking-tight">{formatRupiah(totalKasbon)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang Baru</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Warna dihilangkan, jadi hitam netral */}
            <div className="text-2xl font-bold tracking-tight">{formatRupiah(totalPiutang)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Selisih Kas</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Hanya Selisih Kas yang diberi warna karena ini indikator kritis */}
            <div className={`text-2xl font-bold tracking-tight ${totalSelisih < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {formatRupiah(totalSelisih)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === TABEL DATA === */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput placeholder="Cari data settlement…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Buat Settlement
              </Button>
            )}
          </>
        }
      />
      <SettlementForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}