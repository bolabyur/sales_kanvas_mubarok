import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Package, Truck, ReceiptText, Calculator, CheckCircle2, ShieldCheck 
} from "lucide-react";

export function PlanTimeline({ plan }: { plan: any }) {
  if (!plan) return null;

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "DRAFT") return <Badge variant="secondary">Draft</Badge>;
    if (s === "DISETUJUI" || s === "APPROVED") return <Badge variant="default">Disetujui</Badge>;
    if (s === "ONLOADING") return <Badge variant="outline">Onloading</Badge>;
    if (s === "BATAL") return <Badge variant="destructive">Batal</Badge>;
    if (s === "SETTLED" || s === "CLOSED") return <Badge className="bg-green-600">Selesai</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const isApproved = ["DISETUJUI", "ONLOADING", "SETTLED", "KOMPLIT"].includes(String(plan.status).toUpperCase());

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" /> Timeline Perjalanan Plan
      </h3>
      
      <div className="relative border-l-2 border-muted ml-4 space-y-8 pb-4">
        
        {/* 1. PLAN DIBUAT */}
        <div className="relative pl-6">
          <span className="absolute -left-4.25 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{formatDate(plan.tgl_invoice)}</p>
            <h4 className="font-semibold text-base">Plan Dibuat (Draft)</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Invoice: <strong>{plan.invoice}</strong> | Kendaraan: {plan.vehicle?.nopol}
            </p>
          </div>
        </div>

        {/* 2. PERSETUJUAN PLAN (REAL DATA DARI AUDIT LOG) */}
        {isApproved && (
          <div className="relative pl-6">
            <span className="absolute -left-4.25 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-background">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              {/* PERBAIKAN: Tampilkan Waktu Real dari approvalLog */}
              <p className="text-sm text-muted-foreground">
                {plan.approvalLog ? formatDate(plan.approvalLog.created_at) : "Waktu persetujuan tidak tercatat"}
              </p>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base">Persetujuan Plan</h4>
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Disetujui</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.approvalLog 
                  ? `Disetujui oleh User ID: ${plan.approvalLog.user_id}` 
                  : "Disetujui oleh Supervisor"}
              </p>
            </div>
          </div>
        )}

        {plan.kasbonProduks?.map((bon: any) => (
          <div key={bon.id} className="relative pl-6">
            <span className="absolute -left-4.25 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white ring-4 ring-background">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                {bon.created_at ? formatDate(bon.created_at) : "Tanggal tidak tercatat"}
              </p>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base">Pengajuan Barang (BON #{bon.id})</h4>
                {getStatusBadge(bon.status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total Barang: {bon.detailKasbonProduks?.reduce((sum: number, d: any) => sum + d.qty_bawa, 0) || 0} pcs
              </p>

              {/* Sub-step: Onloading */}
              {bon.produkOuts?.length > 0 && (
                <div className="mt-3 bg-muted/50 p-3 rounded-md border text-sm flex items-center gap-3">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <strong className="block">Barang Keluar (Onloading)</strong>
                    <span className="text-muted-foreground">Tgl Keluar: {formatDate(bon.produkOuts[0].tgl_keluar)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 4. INVOICE PENJUALAN */}
        {plan.invoiceOutlets?.map((inv: any) => (
          <div key={inv.id} className="relative pl-6">
            <span className="absolute -left-4.25 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white ring-4 ring-background">
              <ReceiptText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{formatDate(inv.tgl_invoice)}</p>
              <h4 className="font-semibold text-base">Penjualan ke {inv.outlet?.nama_toko}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{inv.tipe_pembayaran}</Badge>
                <span className="font-bold text-sm">{formatRupiah(inv.total_tagihan)}</span>
              </div>
            </div>
          </div>
        ))}

        {plan.settlements?.map((set: any) => (
          <div key={set.id} className="relative pl-6">
            <span className="absolute -left-4.25 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white ring-4 ring-background">
              <Calculator className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{formatDate(set.updated_at)}</p>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base">Tutup Buku (Settlement)</h4>
                {getStatusBadge(set.status)}
              </div>
              <p className="text-sm mt-1">
                Selisih Kas: <strong className={Number(set.selisih_kas) < 0 ? "text-destructive" : "text-green-600"}>
                  {formatRupiah(set.selisih_kas)}
                </strong>
              </p>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}