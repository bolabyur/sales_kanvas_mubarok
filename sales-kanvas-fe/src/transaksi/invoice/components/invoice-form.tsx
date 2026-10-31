import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { useCreateInvoice } from "../hooks/useInvoice";
import { usePlan, usePlans } from "@/plan/hooks/usePlan";
import { useOutlet } from "@/master/outlet/hooks/useOutlet";
import { useProducts } from "@/master/product/hooks/useProduct";
import { formatRupiah } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlanId?: number;
};

const TIPE_PEMBAYARAN = [
  { value: "Tunai", label: "Tunai" },
  { value: "Kredit", label: "Kredit (Piutang)" },
];

type DetailRow = { produk_id?: number; qty: number; harga_estimasi: number };
const emptyRow: DetailRow = { produk_id: undefined, qty: 1, harga_estimasi: 0 };

const getLocalDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export function InvoiceForm({ open, onOpenChange, defaultPlanId }: Props) {
  const create = useCreateInvoice();
  const { data: planResponse } = usePlans();
  const approvedPlans = ((planResponse as any)?.items || []).filter(
    (p: any) => p.status === "DISETUJUI",
  );

  const { data: outletResponse } = useOutlet();
  const outlets = Array.isArray(outletResponse) ? outletResponse : (outletResponse as any)?.items || [];

  const { data: productsResponse = [] } = useProducts();
  const products = Array.isArray(productsResponse) ? productsResponse : (productsResponse as any)?.items || [];

  const [planId, setPlanId] = useState("");
  const [outletId, setOutletId] = useState(""); 
  const [details, setDetails] = useState<DetailRow[]>([{ ...emptyRow }]);

  const { data: planDetail } = usePlan(Number(planId) || 0);

  useEffect(() => {
    if (open && defaultPlanId) setPlanId(String(defaultPlanId));
  }, [open, defaultPlanId]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      if (!defaultPlanId) setPlanId("");
      setOutletId("");
      setDetails([{ ...emptyRow }]);
    }
    onOpenChange(o);
  };

  const getSisaBarang = (produkId: number) => {
    if (!planDetail) return 0;
    
    let onloaded = 0;
    planDetail.kasbonProduks?.forEach((bon: any) => {
      bon.produkOuts?.forEach((po: any) => {
        po.detailProdukOuts?.forEach((d: any) => {
          if (d.produk_id === produkId) onloaded += d.qty;
        });
      });
    });

    let terjual = 0;
    planDetail.invoiceOutlets?.forEach((inv: any) => {
      inv.detailInvoiceOutlets?.forEach((d: any) => {
        if (d.produk_id === produkId) terjual += d.qty;
      });
    });

    return onloaded - terjual;
  };

  const availableProducts = products.filter((p: any) => getSisaBarang(p.id) > 0);

  const getRealHarga = (produkId: number, currentOutletId: string) => {
    const product: any = products.find((p: any) => p.id === produkId);
    const outlet: any = outlets.find((o: any) => o.id === Number(currentOutletId));
    if (!product || !outlet) return 0;

    if (product.produkHargas && product.produkHargas.length > 0) {
      const matchedPrice = product.produkHargas.find(
        (ph: any) => ph.tipe_harga_id === outlet.tipe_harga_id
      );
      if (matchedPrice) return Number(matchedPrice.harga);
    }
    return 0;
  };

  const handleDetailChange = (index: number, field: keyof DetailRow, value: any) => {
    const next = [...details];
    next[index] = { ...next[index], [field]: value };
    
    if (field === "produk_id") {
      next[index].harga_estimasi = value ? getRealHarga(value, outletId) : 0;
    }
    setDetails(next);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!planId) return toast.error("Pilih Plan!");
    if (!outletId) return toast.error("Pilih Outlet!");
    if (details.some((d) => !d.produk_id || !d.qty)) {
      return toast.error("Lengkapi semua data barang!");
    }

    const isOverStock = details.some((d) => d.produk_id && d.qty > getSisaBarang(d.produk_id));
    if (isOverStock) return toast.error("Qty melebihi sisa barang yang dibawa!");

    create.mutate(
      {
        outlet_id: Number(outletId),
        sales_kanvas_plan_id: Number(planId),
        tipe_pembayaran: fd.get("tipe_pembayaran") as any,
        tgl_invoice: new Date(fd.get("tgl_invoice") as string).toISOString(),
        details: details.map((d) => ({
          produk_id: Number(d.produk_id),
          qty: Number(d.qty),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Invoice berhasil dibuat!");
          handleOpenChange(false);
        },
        onError: (error: any) => {
          toast.error("Gagal membuat Invoice", {
            description: error.response?.data?.message || error.message,
          });
        },
      },
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Buat Invoice Penjualan" className="max-w-[95vw] md:max-w-5xl">
      <form onSubmit={onSubmit} className="grid gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-1 pb-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border p-4 rounded-lg bg-muted/20 w-full min-w-0">
          <FormField label="Pilih Plan" htmlFor="sales_kanvas_plan_id" required>
            <SelectInput
              id="sales_kanvas_plan_id" required
              options={approvedPlans.map((p: any) => ({ value: String(p.id), label: p.invoice }))}
              value={planId} onValueChange={setPlanId} placeholder="Pilih Plan"
            />
          </FormField>
          
          <FormField label="Pilih Outlet" htmlFor="outlet_id" required>
            <SelectInput
              id="outlet_id" required
              options={outlets.map((o: any) => ({ value: String(o.id), label: o.nama_toko }))}
              value={outletId}
              onValueChange={(val) => {
                setOutletId(val);
                setDetails(details.map(d => ({ ...d, harga_estimasi: d.produk_id ? getRealHarga(Number(d.produk_id), val) : 0 })));
              }}
              placeholder="Pilih Outlet"
            />
          </FormField>

          <FormField label="Tgl Invoice" htmlFor="tgl_invoice" required>
            <Input id="tgl_invoice" name="tgl_invoice" type="datetime-local" required defaultValue={getLocalDateTime()} />
          </FormField>
          
          <FormField label="Tipe Pembayaran" htmlFor="tipe_pembayaran" required>
            <SelectInput id="tipe_pembayaran" name="tipe_pembayaran" required options={TIPE_PEMBAYARAN} placeholder="Pilih Tipe" />
          </FormField>
        </div>

        <div className="border p-4 rounded-lg bg-card space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-sm">Detail Barang Terjual</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDetails([...details, { ...emptyRow }])}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          </div>

          {!planId && <p className="text-sm text-center text-muted-foreground py-4">Pilih Plan terlebih dahulu untuk melihat barang yang dibawa.</p>}
          {planId && availableProducts.length === 0 && <p className="text-sm text-center text-destructive py-4">Tidak ada sisa barang bawaan. Silakan lakukan Onloading.</p>}

          {details.map((d, i) => {
            const subtotalEstimasi = (d.qty || 0) * (d.harga_estimasi || 0);
            const maxSisa = d.produk_id ? getSisaBarang(d.produk_id) : 0;
            const isOverStock = d.produk_id ? d.qty > maxSisa : false;


            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md border w-full min-w-0">
                <div className="md:col-span-5">
                  <FormField label="Produk" htmlFor={`produk-${i}`} required>
                    <SelectInput
                      id={`produk-${i}`}
                      options={availableProducts.map((p: any) => ({ value: String(p.id), label: p.name }))}
                      value={d.produk_id ? String(d.produk_id) : ""}
                      onValueChange={(val) => handleDetailChange(i, "produk_id", Number(val))}
                      placeholder="Pilih Produk"
                    />
                  </FormField>
                  {d.produk_id && (
                    <p className={`text-xs mt-1 font-medium ${isOverStock ? 'text-destructive' : 'text-green-600'}`}>
                      Sisa dibawa: {maxSisa} pcs
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <FormField label="Qty" htmlFor={`qty-${i}`} required>
                    <Input
                      id={`qty-${i}`} type="number" min={1} value={d.qty}
                      onChange={(e) => handleDetailChange(i, "qty", Number(e.target.value))}
                      className={isOverStock ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-4 flex flex-col justify-end h-full pt-2 md:pt-6">
                  {d.produk_id && (
                    <div className="text-xs text-muted-foreground">
                      Harga: {formatRupiah(d.harga_estimasi)} <br/>
                      Subtotal: <strong className="text-foreground">{formatRupiah(subtotalEstimasi)}</strong>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 flex justify-end pt-2 md:pt-6">
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDetails(details.filter((_, idx) => idx !== i))} disabled={details.length === 1}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t mt-2 z-10">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={create.isPending || availableProducts.length === 0}>
            {create.isPending ? "Menyimpan…" : "Simpan Invoice"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}