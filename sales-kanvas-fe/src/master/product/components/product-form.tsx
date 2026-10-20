import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectInput } from "@/components/shared/select-input";
import { errorMessage } from "@/lib/errors";
import {
  bool,
  fieldErrors,
  num,
  numOrNull,
  text,
  type FieldErrors,
} from "@/lib/form";
import { useSaveProduct } from "../hooks/useProduct";
import type { Product, TypePrice } from "../types/product.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tambah baru */
  product: Product | null;
};

const REF_FIELDS = [
  { name: "product_brand_id", label: "ID Brand", required: true },
  { name: "product_type_id", label: "ID Tipe Produk", required: true },
  {
    name: "sale_report_group_id",
    label: "ID Grup Laporan",
    required: true,
    hint: "Jenang, Brownies, Konsinyasi",
  },
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
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleOpenChange = (o: boolean) => {
    if (!o) setErrors({});
    onOpenChange(o);
  };

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
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
      },
      {
        onSuccess: () => {
          toast.success(product ? "Produk diperbarui" : "Produk ditambahkan");
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
      className="sm:max-w-2xl"
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nama"
          htmlFor="name"
          required
          error={errors.name}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            name="name"
            required
            autoFocus
            defaultValue={product?.name}
            aria-invalid={!!errors.name}
          />
        </FormField>
        <FormField label="Kode" htmlFor="code" required error={errors.code}>
          <Input
            id="code"
            name="code"
            required
            defaultValue={product?.code}
            aria-invalid={!!errors.code}
          />
        </FormField>
        <FormField
          label="Barcode"
          htmlFor="barcode"
          required
          error={errors.barcode}
        >
          <Input
            id="barcode"
            name="barcode"
            required
            defaultValue={product?.barcode}
            aria-invalid={!!errors.barcode}
          />
        </FormField>

        {REF_FIELDS.map((f) => (
          <FormField
            key={f.name}
            label={f.label}
            htmlFor={f.name}
            required={"required" in f}
            hint={"hint" in f ? f.hint : undefined}
            error={errors[f.name]}
          >
            <Input
              id={f.name}
              name={f.name}
              type="number"
              min={1}
              required={"required" in f}
              defaultValue={product?.[f.name] ?? ""}
              aria-invalid={!!errors[f.name]}
            />
          </FormField>
        ))}

        <FormField
          label="Tipe Harga"
          htmlFor="type_price"
          required
          error={errors.type_price}
        >
          <SelectInput
            id="type_price"
            name="type_price"
            required
            options={TYPE_PRICE_OPTIONS}
            defaultValue={product?.type_price ?? "FIXED"}
          />
        </FormField>
        <FormField label="HPP (Rp)" htmlFor="hpp" error={errors.hpp}>
          <Input
            id="hpp"
            name="hpp"
            type="number"
            min={0}
            step="0.01"
            defaultValue={product?.hpp ?? ""}
            aria-invalid={!!errors.hpp}
          />
        </FormField>
        <FormField
          label="Isian per kemasan"
          htmlFor="isian"
          error={errors.isian}
        >
          <Input
            id="isian"
            name="isian"
            type="number"
            step={1}
            defaultValue={product?.isian ?? ""}
            aria-invalid={!!errors.isian}
          />
        </FormField>
        <FormField label="Berat (gram)" htmlFor="weight" error={errors.weight}>
          <Input
            id="weight"
            name="weight"
            type="number"
            step={1}
            defaultValue={product?.weight ?? ""}
            aria-invalid={!!errors.weight}
          />
        </FormField>
        <FormField
          label="Masa expired (hari)"
          htmlFor="expired_count"
          error={errors.expired_count}
        >
          <Input
            id="expired_count"
            name="expired_count"
            type="number"
            step={1}
            defaultValue={product?.expired_count ?? ""}
            aria-invalid={!!errors.expired_count}
          />
        </FormField>

        <label className="flex items-center gap-2 self-end text-sm sm:pb-2">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
            className="size-4 accent-primary"
          />
          Aktif
          <span className="text-xs text-muted-foreground">
            (nonaktif = hilang dari daftar)
          </span>
        </label>

        <DialogFooter className="sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
