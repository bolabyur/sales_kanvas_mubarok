import { useState, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectInput } from "@/components/shared/select-input";
import { Wallet, TrendingUp, TrendingDown, Receipt, CreditCard, AlertCircle } from "lucide-react";
import { useSummarySale, useSummarySaleZona, useSummaryRekonsiliasi } from "../hooks/useSummary";

export function SummaryPage() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  const [selectedZona, setSelectedZona] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const { data: sale, isLoading: loadSale } = useSummarySale(startDate, endDate);
  const { data: zona, isLoading: loadZona } = useSummarySaleZona(startDate, endDate);
  const { data: rekon, isLoading: loadRekon } = useSummaryRekonsiliasi();

  const filteredZona = useMemo(() => {
    if (!zona) return [];
    if (!selectedZona) return zona;
    return zona.filter(z => String(z.market_area_id) === selectedZona);
  }, [zona, selectedZona]);

  const filteredPiutang = useMemo(() => {
    if (!rekon?.daftar_piutang) return [];
    if (!onlyOverdue) return rekon.daftar_piutang;
    return rekon.daftar_piutang.filter(p => p.status === "MENUNGGAK");
  }, [rekon, onlyOverdue]);

  const zonaOptions = zona?.map(z => ({ value: String(z.market_area_id), label: z.nama_zona })) || [];

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-wrap items-end gap-4 bg-muted/20 p-4 rounded-lg border">
        <div className="grid gap-1.5">
          <Label>Dari Tanggal</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Sampai Tanggal</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        
        <div className="grid gap-1.5 w-48">
          <Label>Filter Zona</Label>
          <SelectInput 
            options={zonaOptions} 
            value={selectedZona} 
            onValueChange={setSelectedZona} 
            placeholder="Semua Zona" 
          />
        </div>
        
        {(loadSale || loadZona || loadRekon) && (
          <div className="ml-auto text-sm text-primary animate-pulse font-medium pb-2">
            Memuat data...
          </div>
        )}
      </div>

      {/* KARTU RINGKASAN (SHADCN STYLE) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoice</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sale?.total_invoice || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Bruto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(sale?.penjualan_bruto || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retur</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-{formatRupiah(sale?.total_retur || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Neto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(sale?.penjualan_neto || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kasbon</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(sale?.total_kasbon || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Piutang Baru</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(sale?.total_piutang || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL BAWAH */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tabel Zona */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Zona</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Wilayah</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                  <TableHead className="text-right">Total (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZona.map((z) => (
                  <TableRow key={z.market_area_id}>
                    <TableCell className="font-medium">{z.nama_zona}</TableCell>
                    <TableCell className="text-right">{z.total_invoice}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(z.total_penjualan)}</TableCell>
                  </TableRow>
                ))}
                {!filteredZona.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabel Rekonsiliasi Piutang */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Rekonsiliasi Piutang</span>
              <span className="text-sm text-muted-foreground font-normal">
                Total: <strong className="text-foreground">{formatRupiah(rekon?.ringkasan.total_saldo_piutang || 0)}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4 bg-muted/30 p-2 rounded-md">
              <input 
                type="checkbox" 
                id="overdue" 
                className="size-4 accent-primary" 
                checked={onlyOverdue} 
                onChange={(e) => setOnlyOverdue(e.target.checked)} 
              />
              <label htmlFor="overdue" className="text-sm font-medium cursor-pointer">Hanya tampilkan yang Menunggak</label>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Sisa Piutang</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPiutang.map((p) => (
                  <TableRow key={p.invoice_id}>
                    <TableCell>
                      <div className="font-medium">{p.outlet}</div>
                      <div className="text-xs text-muted-foreground">{p.zona}</div>
                    </TableCell>
                    <TableCell>{p.jatuh_tempo ? formatDate(p.jatuh_tempo) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(p.sisa_piutang)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.status === "MENUNGGAK" ? "destructive" : "outline"}>
                        {p.status === "MENUNGGAK" ? "Menunggak" : "Aman"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredPiutang.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Tidak ada piutang aktif</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}