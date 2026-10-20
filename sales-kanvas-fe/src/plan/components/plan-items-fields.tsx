import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/shared/select-input";
import type { Employee } from "@/master/employee/types/employee.types";
import type { KasbonMaterialType } from "@/master/kasbon-material-type/types/kasbonMaterialType.types";
import type { Product } from "@/master/product/types/product.types";
import { formatRupiah } from "@/lib/format";

export type PersonilRow = { employee_id: string; position: string };
export type DetailRow = { product_id: string; qty: string };
export type KasbonRow = {
  kasbon_material_type_id: string;
  price: string;
  qty: string;
};

type RowsProps<R, O> = {
  rows: R[];
  onChange: (rows: R[]) => void;
  options: O[];
};

function patchRow<R>(rows: R[], i: number, patch: Partial<R>) {
  return rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
}

function Section({
  title,
  onAdd,
  empty,
  children,
}: {
  title: string;
  onAdd: () => void;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Tambah baris
        </Button>
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground">Belum ada data.</p>
      ) : (
        children
      )}
    </section>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Hapus baris"
      onClick={onClick}
    >
      <X />
    </Button>
  );
}

const POSITIONS = ["Sopir", "Sales", "Helper"];

export function PersonilFields({
  rows,
  onChange,
  options,
}: RowsProps<PersonilRow, Employee>) {
  const items = options.map((o) => ({
    value: String(o.id),
    label: o.nip ? `${o.name} (${o.nip})` : o.name,
  }));
  return (
    <Section
      title="Personil"
      empty={!rows.length}
      onAdd={() => onChange([...rows, { employee_id: "", position: "" }])}
    >
      <datalist id="plan-positions">
        {POSITIONS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[2fr_1fr_auto]"
        >
          <SelectInput
            aria-label="Karyawan"
            placeholder="Pilih karyawan…"
            required
            options={items}
            value={r.employee_id}
            onValueChange={(v) =>
              onChange(patchRow(rows, i, { employee_id: v }))
            }
          />
          <Input
            aria-label="Posisi"
            placeholder="Posisi"
            list="plan-positions"
            required
            className="col-start-1 sm:col-start-auto"
            value={r.position}
            onChange={(e) =>
              onChange(patchRow(rows, i, { position: e.target.value }))
            }
          />
          <div className="col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
            <RemoveButton
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            />
          </div>
        </div>
      ))}
    </Section>
  );
}

export function DetailFields({
  rows,
  onChange,
  options,
}: RowsProps<DetailRow, Product>) {
  const items = options.map((o) => ({
    value: String(o.id),
    label: `${o.code} — ${o.name}`,
  }));
  return (
    <Section
      title="Produk"
      empty={!rows.length}
      onAdd={() => onChange([...rows, { product_id: "", qty: "" }])}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_6rem_auto] items-center gap-2"
        >
          <SelectInput
            aria-label="Produk"
            placeholder="Pilih produk…"
            required
            options={items}
            value={r.product_id}
            onValueChange={(v) =>
              onChange(patchRow(rows, i, { product_id: v }))
            }
          />
          <Input
            aria-label="Qty"
            placeholder="Qty"
            type="number"
            min={1}
            step={1}
            required
            value={r.qty}
            onChange={(e) =>
              onChange(patchRow(rows, i, { qty: e.target.value }))
            }
          />
          <RemoveButton
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
          />
        </div>
      ))}
    </Section>
  );
}

export function KasbonFields({
  rows,
  onChange,
  options,
}: RowsProps<KasbonRow, KasbonMaterialType>) {
  const items = options.map((o) => ({ value: String(o.id), label: o.name }));
  const total = rows.reduce(
    (sum, r) => sum + Number(r.price || 0) * Number(r.qty || 0),
    0,
  );
  return (
    <Section
      title="Kasbon Material"
      empty={!rows.length}
      onAdd={() =>
        onChange([
          ...rows,
          { kasbon_material_type_id: "", price: "", qty: "1" },
        ])
      }
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:grid-cols-[2fr_1fr_5rem_auto]"
        >
          <SelectInput
            aria-label="Jenis kasbon"
            placeholder="Pilih jenis…"
            className="col-span-2 sm:col-span-1"
            required
            options={items}
            value={r.kasbon_material_type_id}
            onValueChange={(v) =>
              onChange(patchRow(rows, i, { kasbon_material_type_id: v }))
            }
          />
          <Input
            aria-label="Harga"
            placeholder="Harga (Rp)"
            type="number"
            min={1}
            step="0.01"
            required
            value={r.price}
            onChange={(e) =>
              onChange(patchRow(rows, i, { price: e.target.value }))
            }
          />
          <Input
            aria-label="Qty"
            placeholder="Qty"
            type="number"
            min={1}
            step={1}
            required
            value={r.qty}
            onChange={(e) =>
              onChange(patchRow(rows, i, { qty: e.target.value }))
            }
          />
          <div className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto">
            <RemoveButton
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            />
          </div>
        </div>
      ))}
      <p className="text-right text-sm">
        Total:{" "}
        <span className="font-medium tabular-nums">{formatRupiah(total)}</span>
      </p>
    </Section>
  );
}
