const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatDate = (v?: string | null) =>
  v ? dateFmt.format(new Date(v)) : "-";

export const formatRupiah = (v?: number | string | null) =>
  v == null ? "-" : rupiahFmt.format(Number(v));

export const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : "");
