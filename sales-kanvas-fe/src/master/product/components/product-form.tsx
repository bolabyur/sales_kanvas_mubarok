import { useState, useEffect, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TYPE_PRICE_OPTIONS = [
  { value: "FIXED", label: "Fixed" },
  { value: "PERSENTASE", label: "Persentase" },
  { value: "Retail", label: "Retail (Data Lama)" },
];

// Dummy Options (Ganti dengan data API jika sudah ada)
const BRAND_OPTIONS = [
  { value: "1", label: "Mubarokfood" },
  { value: "2", label: "Brand Lain" },
];
const PRODUCT_TYPE_OPTIONS = [
  { value: "1", label: "Makanan Ringan" },
  { value: "2", label: "Minuman" },
];
const SALE_GROUP_OPTIONS = [
  { value: "1", label: "Jenang & Brownies" },
  { value: "2", label: "Konsinyasi" },
];
const SUPPLIER_OPTIONS = [
  { value: "1", label: "PT. Supplier Utama" },
  { value: "2", label: "CV. Supplier Lokal" },
];

const formatNumber = (val: string | number) => {
  if (val === null || val === undefined || val === "") return "";
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (val: string) => {
  return Number(val.replace(/\./g, ""));
};

export function ProductForm({ open, onOpenChange, product }: Props) {
  const save = useSaveProduct();
  const { data: tipeHargaList = [] } = useTipeHarga(); 
  const [errors, setErrors] = useState<FieldErrors>({});
  
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [hppDisplay, setHppDisplay] = useState<string>("");
  const [typePrice, setTypePrice] = useState<string>("FIXED");

  useEffect(() => {
    if (product) {
      setHppDisplay(product.hpp ? formatNumber(Number(product.hpp)) : "");
      setTypePrice(product.type_price || "FIXED");

      if ((product as any).produkHargas) {
        const initialPrices: Record<number, string> = {};
        (product as any).produkHargas.forEach((ph: any) => {
          initialPrices[ph.tipe_harga_id] = formatNumber(Number(ph.harga));
        });
        setPrices(initialPrices);
      }
    } else {
      setHppDisplay("");
      setTypePrice("FIXED");
      setPrices({});
    }
  }, [product]);

  const handleOpenChange = (o: boolean) => {
    if (!o) setErrors({});
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    
    const pricesArray = Object.entries(prices)
      .filter(([_, harga]) => harga !== "")
      .map(([tipeId, harga]) => ({
        tipe_harga_id: Number(tipeId),
        harga: parseNumber(harga),
      }));

    const finalHpp = hppDisplay ? parseNumber(hppDisplay) : null;
    
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
        type_price: typePrice as TypePrice,
        hpp: finalHpp, 
        is_active: bool(fd, "is_active"),
        prices: pricesArray,
      },
      {
        onSuccess: () => {
          toast.success("Produk berhasil disimpan!");
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
    <Modal open={open} onOpenChange={handleOpenChange} title={product ? "Ubah Produk" : "Tambah Produk"} className="max-w-[95vw] md:max-w-4xl">
      <form onSubmit={onSubmit} className="flex flex-col max-h-[85vh]">
        
        {/* AREA SCROLL (Isi Form dengan Tabs) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="info">Info Dasar</TabsTrigger>
              <TabsTrigger value="relasi">Relasi & Harga</TabsTrigger>
              <TabsTrigger value="spesifikasi">Spesifikasi</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFO DASAR */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                <FormField label="Nama Produk" htmlFor="name" required error={errors.name} className="md:col-span-2">
                  <Input id="name" name="name" required autoFocus defaultValue={product?.name} aria-invalid={!!errors.name} />
                </FormField>
                <FormField label="Kode Produk" htmlFor="code" required error={errors.code}>
                  <Input id="code" name="code" required defaultValue={product?.code} aria-invalid={!!errors.code} />
                </FormField>
                <FormField label="Barcode" htmlFor="barcode" required error={errors.barcode}>
                  <Input id="barcode" name="barcode" required defaultValue={product?.barcode} aria-invalid={!!errors.barcode} />
                </FormField>
                <FormField label="Tipe Harga Dasar" htmlFor="type_price" required error={errors.type_price}>
                  <SelectInput 
                    id="type_price" name="type_price" required 
                    options={TYPE_PRICE_OPTIONS} value={typePrice} onValueChange={setTypePrice}
                  />
                </FormField>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4 accent-primary" />
                    Status Aktif (Tampil di kasir)
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: RELASI & HARGA */}
            <TabsContent value="relasi" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-card">
                <div className="md:col-span-2 mb-2">
                  <h3 className="font-semibold text-sm">Relasi Master Data</h3>
                </div>
                <FormField label="Brand" htmlFor="product_brand_id" required error={errors.product_brand_id}>
                  <SelectInput id="product_brand_id" name="product_brand_id" required options={BRAND_OPTIONS} defaultValue={product?.product_brand_id?.toString()} />
                </FormField>
                <FormField label="Tipe Produk" htmlFor="product_type_id" required error={errors.product_type_id}>
                  <SelectInput id="product_type_id" name="product_type_id" required options={PRODUCT_TYPE_OPTIONS} defaultValue={product?.product_type_id?.toString()} />
                </FormField>
                <FormField label="Grup Laporan" htmlFor="sale_report_group_id" required error={errors.sale_report_group_id}>
                  <SelectInput id="sale_report_group_id" name="sale_report_group_id" required options={SALE_GROUP_OPTIONS} defaultValue={product?.sale_report_group_id?.toString()} />
                </FormField>
                <FormField label="Supplier" htmlFor="supplier_id" required error={errors.supplier_id}>
                  <SelectInput id="supplier_id" name="supplier_id" required options={SUPPLIER_OPTIONS} defaultValue={product?.supplier_id?.toString()} />
                </FormField>
              </div>

              <div className="border p-4 rounded-lg bg-card">
                <h3 className="font-semibold text-sm mb-4 border-b pb-2">Pengaturan Harga Jual & HPP</h3>
                <div className="mb-4">
                  <FormField label="HPP (Rp)" htmlFor="hpp" error={errors.hpp}>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                      <Input id="hpp" name="hpp" type="text" className="pl-10" placeholder="0"
                        value={hppDisplay} onChange={(e) => setHppDisplay(formatNumber(e.target.value.replace(/\D/g, "")))} />
                    </div>
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tipeHargaList.map((tipe: any) => (
                    <div key={tipe.id} className="space-y-2 border p-3 rounded-md bg-muted/10">
                      <label className="text-sm font-medium">{tipe.nama_tipe}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                        <Input type="text" inputMode="numeric" className="pl-10" placeholder="0"
                          value={prices[tipe.id] ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setPrices({ ...prices, [tipe.id]: raw ? formatNumber(raw) : "" });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SPESIFIKASI */}
            <TabsContent value="spesifikasi" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-card">
                <FormField label="Isian per kemasan" htmlFor="isian" error={errors.isian}>
                  <Input id="isian" name="isian" type="number" step={1} defaultValue={product?.isian ?? ""} />
                </FormField>
                <FormField label="Berat (gram)" htmlFor="weight" error={errors.weight}>
                  <Input id="weight" name="weight" type="number" step={1} defaultValue={product?.weight ?? ""} />
                </FormField>
                <FormField label="Masa expired (hari)" htmlFor="expired_count" error={errors.expired_count}>
                  <Input id="expired_count" name="expired_count" type="number" step={1} defaultValue={product?.expired_count ?? ""} />
                </FormField>
                <FormField label="ID Rasa Jenang (Opsional)" htmlFor="jenang_flavor_id" error={errors.jenang_flavor_id}>
                  <Input id="jenang_flavor_id" name="jenang_flavor_id" type="number" min={1} defaultValue={product?.jenang_flavor_id ?? ""} />
                </FormField>
                <FormField label="ID Satuan (Opsional)" htmlFor="unit_id" error={errors.unit_id}>
                  <Input id="unit_id" name="unit_id" type="number" min={1} defaultValue={product?.unit_id ?? ""} />
                </FormField>
              </div>
            </TabsContent>
          </Tabs>
        </div> 

        {/* FOOTER (Di luar area scroll) */}
        <DialogFooter className="pt-4 border-t mt-2 flex justify-end gap-2 shrink-0 bg-background">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan Produk"}</Button>
        </DialogFooter>

      </form>
    </Modal>
  );
}