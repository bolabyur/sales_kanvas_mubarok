import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { Badge } from "@/components/ui/badge";
import { useCreateKasbonProduk } from "../hooks/useKasbonProduk";
import { usePlans } from "@/plan/hooks/usePlan";
import { useProducts } from "@/master/product/hooks/useProduct";
import { useBatches } from "@/master/batch/hooks/useBatch";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPlanId?: number;
};

type DetailRow = { product_id: string; qty_bawa: number };
type OperasionalRow = {
  nama_pengeluaran: string;
  nominal: number;
  foto_bukti: string;
};

const emptyRow: DetailRow = { product_id: "", qty_bawa: 1 };
const emptyOps: OperasionalRow = {
  nama_pengeluaran: "",
  nominal: 0,
  foto_bukti: "default.jpg",
};

const formatRupiah = (value: number) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const getErrorMessage = (err: any) => {
  if (err?.details && Array.isArray(err.details)) {
    return err.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
  }
  const msg = err.response?.data?.message || err.message;
  if (Array.isArray(msg)) return msg.map((m: any) => m.message || m).join(", ");
  if (typeof msg === "object") return JSON.stringify(msg);
  return msg || "Terjadi kesalahan";
};

export function KasbonProdukForm({ open, onOpenChange, defaultPlanId }: Props) {
  const create = useCreateKasbonProduk();

  const { data: planResponse } = usePlans();
  const approvedPlans = ((planResponse as any)?.items || []).filter(
    (p: any) =>
      p.status === "DISETUJUI" &&
      (!p.kasbonProduks || p.kasbonProduks.length === 0),
  );
  const { data: productsResponse } = useProducts();
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : (productsResponse as any)?.items || [];

  const { data: batchesResponse } = useBatches();
  const batches = Array.isArray(batchesResponse)
    ? batchesResponse
    : (batchesResponse as any)?.items || [];

  const [planId, setPlanId] = useState("");
  const [details, setDetails] = useState<DetailRow[]>([{ ...emptyRow }]);
  const [operasional, setOperasional] = useState<OperasionalRow[]>([
    { ...emptyOps },
  ]);

  useEffect(() => {
    if (open && defaultPlanId) setPlanId(String(defaultPlanId));
  }, [open, defaultPlanId]);

  const getAvailableStock = (productId: string) => {
    if (!productId) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return batches
      .filter((b: any) => {
        const isSameProduct = String(b.produk_id) === productId;
        const isNotDeleted = !b.is_deleted;
        const isNotExpired = new Date(b.expired_date) >= today;
        return isSameProduct && isNotDeleted && isNotExpired;
      })
      .reduce((sum: number, b: any) => sum + (b.stok_gudang || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!planId) return toast.error("Pilih Rencana Kanvas terlebih dahulu.");

    if (details.some((d) => !d.product_id || !d.qty_bawa))
      return toast.error("Lengkapi data produk dan qty.");

    if (operasional.some((o) => !o.nama_pengeluaran.trim() || o.nominal <= 0))
      return toast.error(
        "Lengkapi data Kasbon Operasional (Nama & Nominal wajib diisi).",
      );

    const isStokKurang = details.some(
      (d) => d.product_id && d.qty_bawa > getAvailableStock(d.product_id),
    );
    if (isStokKurang)
      return toast.error("Ada barang yang stoknya tidak mencukupi!");

    create.mutate(
      {
        sales_kanvas_plan_id: Number(planId),
        details: details.map((d) => ({
          produk_id: Number(d.product_id),
          qty_bawa: Number(d.qty_bawa),
        })),
        operasional: operasional.map((o) => ({
          nama_pengeluaran: o.nama_pengeluaran,
          nominal: Number(o.nominal),
          foto_bukti: o.foto_bukti,
        })),
      },
      {
        onSuccess: () => {
          toast.success("BON Barang berhasil diajukan!");
          onOpenChange(false);
          if (!defaultPlanId) setPlanId("");
          setDetails([{ ...emptyRow }]);
          setOperasional([{ ...emptyOps }]);
        },
        onError: (err: any) => {
          toast.error("Gagal mengajukan BON", {
            description: getErrorMessage(err),
          });
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ajukan BON Barang"
      className="max-w-[95vw] md:max-w-5xl"
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 max-h-[75vh] overflow-y-auto overflow-x-hidden px-1 pb-2"
      >
        <FormField
          label="Pilih Rencana Kanvas (Disetujui)"
          htmlFor="plan_id"
          required
        >
          <SelectInput
            id="sales_kanvas_plan_id"
            required
            options={approvedPlans.map((p: any) => ({
              value: String(p.id),
              label: p.invoice || `Plan ID: ${p.id}`,
            }))}
            value={planId}
            onValueChange={setPlanId}
            placeholder="Pilih Plan"
          />
        </FormField>

        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-900">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Batch akan dialokasikan otomatis oleh sistem berdasarkan{" "}
            <strong>ED terdekat (FEFO)</strong> saat Gudang memproses Onloading.
          </span>
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-muted/10 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">
              Daftar Barang yang Diminta
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDetails([...details, { ...emptyRow }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>

          {details.map((d, i) => {
            const stokTersedia = d.product_id
              ? getAvailableStock(d.product_id)
              : 0;
            const isOverStock = d.product_id
              ? d.qty_bawa > stokTersedia
              : false;

            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[1fr_100px_40px] gap-4 items-start w-full border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="min-w-0">
                  <FormField label="Produk" htmlFor={`prod-${i}`}>
                    <SelectInput
                      value={d.product_id}
                      onValueChange={(v) =>
                        setDetails(
                          details.map((item, idx) =>
                            idx === i ? { ...item, product_id: v } : item,
                          ),
                        )
                      }
                      options={products.map((p: any) => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                      placeholder="Pilih Produk"
                    />
                  </FormField>

                  {d.product_id && (
                    <div className="text-xs mt-2 flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">
                        Stok FEFO:
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          isOverStock
                            ? "border-destructive/50 text-destructive bg-destructive/10 font-bold"
                            : "border-green-200 text-green-700 bg-green-50 font-bold"
                        }
                      >
                        {stokTersedia} pcs
                      </Badge>
                      {isOverStock && (
                        <span className="text-destructive font-medium">
                          (Kurang!)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <FormField label="Qty" htmlFor={`qty-${i}`}>
                    <Input
                      type="number"
                      min={1}
                      value={d.qty_bawa}
                      onChange={(e) =>
                        setDetails(
                          details.map((item, idx) =>
                            idx === i
                              ? { ...item, qty_bawa: Number(e.target.value) }
                              : item,
                          ),
                        )
                      }
                      className={
                        isOverStock
                          ? "border-destructive focus-visible:ring-destructive font-bold"
                          : "font-bold"
                      }
                    />
                  </FormField>
                </div>

                <div className="w-full flex justify-end pt-7">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDetails(details.filter((_, idx) => idx !== i))
                    }
                    disabled={details.length === 1}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-muted/10 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm text-primary">
              Kasbon Operasional (Wajib)
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOperasional([...operasional, { ...emptyOps }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah Operasional
            </Button>
          </div>

          {operasional.map((ops, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_160px_40px] gap-4 items-start w-full border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0"
            >
              <div className="w-full">
                <FormField label="Nama Pengeluaran" htmlFor={`ops-name-${i}`}>
                  <Input
                    placeholder="Misal: Bensin, Uang Makan, Parkir"
                    value={ops.nama_pengeluaran}
                    onChange={(e) =>
                      setOperasional(
                        operasional.map((item, idx) =>
                          idx === i
                            ? { ...item, nama_pengeluaran: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="w-full">
                <FormField label="Nominal" htmlFor={`ops-nominal-${i}`}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      Rp
                    </span>
                    <Input
                      type="text"
                      className="pl-10 font-medium"
                      placeholder="0"
                      value={formatRupiah(ops.nominal)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        setOperasional(
                          operasional.map((item, idx) =>
                            idx === i
                              ? { ...item, nominal: Number(rawValue) }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>
                </FormField>
              </div>

              <div className="w-full flex justify-end pt-7">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setOperasional(operasional.filter((_, idx) => idx !== i))
                  }
                  disabled={operasional.length === 1}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t mt-2 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={create.isPending || approvedPlans.length === 0}
            className="w-full sm:w-auto"
          >
            {create.isPending ? "Mengajukan..." : "Ajukan BON"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
