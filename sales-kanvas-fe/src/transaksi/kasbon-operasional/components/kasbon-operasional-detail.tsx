import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/auth/hooks/usePermission";
import { useUpdateStatusKasbonOp } from "../hooks/useKasbonOperasional";
import type { KasbonOperasional } from "../types/kasbon-operasional.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: KasbonOperasional | null; };

export function KasbonOperasionalDetail({ open, onOpenChange, data }: Props) {
  const updateStatus = useUpdateStatusKasbonOp();
  const canApprove = usePermission()("kasbon-operasional:update");

  if (!data) return null;
  const isPending = data.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Kasbon Operasional #{data.id}</DialogTitle>
          <DialogDescription>
            Plan: <strong>{data.salesKanvasPlan?.invoice || "-"}</strong> | 
            Total Kasbon: <strong>{formatRupiah(data.nominal_kasbon)}</strong> | 
            Tanggal: {formatDate(data.updated_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nama Pengeluaran</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Bukti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailKasbonOperasional?.length ? (
                data.detailKasbonOperasional.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.nama_pengeluaran}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.nominal)}</TableCell>
                    <TableCell><Badge variant="outline">{item.foto_bukti}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Tidak ada rincian.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {canApprove && isPending && (
          <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t pt-4">
            <Button 
              variant="destructive" 
              onClick={() => updateStatus.mutate({ id: data.id, status: "REJECTED" }, { onSuccess: () => onOpenChange(false) })}
              disabled={updateStatus.isPending}
            >
              Tolak Kasbon
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateStatus.mutate({ id: data.id, status: "APPROVED" }, { onSuccess: () => onOpenChange(false) })}
              disabled={updateStatus.isPending}
            >
              Setujui (ACC)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}