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

/** Decimal Prisma datang sebagai string ("12500.00"). */
export const formatRupiah = (v?: number | string | null) =>
  v == null ? "-" : rupiahFmt.format(Number(v));

/** Konversi tanggal ke format input date. */
export const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : "");
