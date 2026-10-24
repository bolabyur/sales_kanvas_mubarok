import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { errorMessage } from "@/lib/errors";
import { bool, fieldErrors, num, numOrNull, text, type FieldErrors } from "@/lib/form";
import { useSaveProduct } from "../hooks/useProduct";
import { useTipeHarga } from "../../tipe-harga/hooks/useTipeHarga";
import type { Product, TypePrice } from "../types/product.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
};

const REF_FIELDS = [
  { name: "product_brand_id", label: "ID Brand", required: true },
  { name: "product_type_id", label: "ID Tipe Produk", required: true },
  { name: "sale_report_group_id", label: "ID Grup Laporan", required: true, hint: "Jenang, Brownies, Konsinyasi" },
  { name: "supplier_id", label: "ID Supplier", required: true },
  { name: "jenang_flavor_id", label: "ID Rasa Jenang" },
  { name: "unit_id", label: "ID Satuan" },
] as const;

const TYPE_PRICE_OPTIONS = [
  { value: "FIXED", label: "Fixed" },
  { value: "PERSENTASE", label: "Persentase" },
];

export function ProductForm({ open, onOpenChange, product }: Props) {
  const save = useSaveProduct();
  const { data: tipeHargaList = [] } = useTipeHarga(); 
  const [errors, setErrors] = useState<FieldErrors>({});
  const [prices, setPrices] = useState<Record<number, number>>({});

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setErrors({});
      setPrices({}); 
    }
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    
    const pricesArray = Object.entries(prices).map(([tipeId, harga]) => ({
      tipe_harga_id: Number(tipeId),
      harga: harga,
    }));

    save.mutate(
      {
        id: product?.id,
        name: text(fd, "name"),
        code: text(fd, "code"),
        barcode: text(fd, "barcode"),
        product_brand_id: num(fd, "product_brand_id"),
        product_type_id: num(fd, "product_type_id"),
        sale_report_group_id: num(fd, "sale_report_group_id"),
        supplier_id: num(fd, "supplier_id"),
        jenang_flavor_id: numOrNull(fd, "jenang_flavor_id"),
        unit_id: numOrNull(fd, "unit_id"),
        isian: numOrNull(fd, "isian"),
        weight: numOrNull(fd, "weight"),
        expired_count: numOrNull(fd, "expired_count"),
        type_price: text(fd, "type_price") as TypePrice,
        hpp: numOrNull(fd, "hpp"),
        is_active: bool(fd, "is_active"),
        prices: pricesArray,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
        onError: (err) => {
          setErrors(fieldErrors(err));
          toast.error(errorMessage(err));
        },
      },
    );
  }

  return (
    <Modal 
      open={open} 
      onOpenChange={handleOpenChange} 
      title={product ? "Ubah Produk" : "Tambah Produk"} 
      className="max-w-[95vw] md:max-w-5xl" // <-- LANDSCAPE (Lebar)
    >
      <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-3 max-h-[80vh] overflow-y-auto px-1 pb-4">
        
        {/* SECTION 1: INFO DASAR */}
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField label="Nama Produk" htmlFor="name" required error={errors.name} className="sm:col-span-3">
            <Input id="name" name="name" required autoFocus defaultValue={product?.name} aria-invalid={!!errors.name} />
          </FormField>
          <FormField label="Kode Produk" htmlFor="code" required error={errors.code}>
            <Input id="code" name="code" required defaultValue={product?.code} aria-invalid={!!errors.code} />
          </FormField>
          <FormField label="Barcode" htmlFor="barcode" required error={errors.barcode}>
            <Input id="barcode" name="barcode" required defaultValue={product?.barcode} aria-invalid={!!errors.barcode} />
          </FormField>
          <FormField label="Tipe Harga Dasar" htmlFor="type_price" required error={errors.type_price}>
            <SelectInput id="type_price" name="type_price" required options={TYPE_PRICE_OPTIONS} defaultValue={product?.type_price ?? "FIXED"} />
          </FormField>
        </div>

        {/* SECTION 2: RELASI MASTER DATA */}
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-card">
          <div className="sm:col-span-3 mb-2">
            <h3 className="font-semibold text-sm">Relasi Master Data</h3>
          </div>
          {REF_FIELDS.map((f) => (
            <FormField key={f.name} label={f.label} htmlFor={f.name} required={"required" in f} hint={"hint" in f ? f.hint : undefined} error={errors[f.name]}>
              <Input id={f.name} name={f.name} type="number" min={1} required={"required" in f} defaultValue={product?.[f.name] ?? ""} aria-invalid={!!errors[f.name]} />
            </FormField>
          ))}
        </div>

        {/* SECTION 3: DETAIL TAMBAHAN */}
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-card">
          <div className="sm:col-span-3 mb-2">
             <h3 className="font-semibold text-sm">Detail & Spesifikasi</h3>
          </div>
          <FormField label="HPP (Rp)" htmlFor="hpp" error={errors.hpp}>
            <Input id="hpp" name="hpp" type="number" min={0} step="0.01" defaultValue={product?.hpp ?? ""} aria-invalid={!!errors.hpp} />
          </FormField>
          <FormField label="Isian per kemasan" htmlFor="isian" error={errors.isian}>
            <Input id="isian" name="isian" type="number" step={1} defaultValue={product?.isian ?? ""} aria-invalid={!!errors.isian} />
          </FormField>
          <FormField label="Berat (gram)" htmlFor="weight" error={errors.weight}>
            <Input id="weight" name="weight" type="number" step={1} defaultValue={product?.weight ?? ""} aria-invalid={!!errors.weight} />
          </FormField>
          <FormField label="Masa expired (hari)" htmlFor="expired_count" error={errors.expired_count}>
            <Input id="expired_count" name="expired_count" type="number" step={1} defaultValue={product?.expired_count ?? ""} aria-invalid={!!errors.expired_count} />
          </FormField>
          
          <div className="sm:col-span-3 flex items-center pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4 accent-primary" />
              Status Aktif <span className="text-xs text-muted-foreground">(nonaktif = hilang dari daftar)</span>
            </label>
          </div>
        </div>

        {/* SECTION 4: HARGA JUAL (Dinamis berdasarkan Tipe Harga) */}
        <div className="sm:col-span-3 border p-4 rounded-lg bg-card">
          <h3 className="font-semibold text-sm mb-4 border-b pb-2">Pengaturan Harga Jual per Tipe</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tipeHargaList.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">Belum ada Tipe Harga. Silakan buat di menu Tipe Harga.</p>
            )}
            {tipeHargaList.map((tipe) => (
              <div key={tipe.id} className="space-y-2 border p-3 rounded-md bg-muted/10">
                <label className="text-sm font-medium">{tipe.nama_tipe}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                  <Input
                    type="number"
                    className="pl-10"
                    placeholder="0"
                    value={prices[tipe.id] || ""}
                    onChange={(e) => setPrices({ ...prices, [tipe.id]: Number(e.target.value) })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="sm:col-span-3 sticky bottom-0 bg-background pt-4 border-t mt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan Produk"}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}