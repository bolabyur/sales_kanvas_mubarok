export type PembayaranPayload = {
  invoice_outlet_id: number;
  nominal_bayar: number;
  tipe_bayar: string;
  tgl_bayar: string;
};

export type Pembayaran = {
  id: number;
  invoice_outlet_id: number;
  nominal_bayar: string;
  tipe_bayar: string;
  tgl_bayar: string;
  invoiceOutlet?: any;
};