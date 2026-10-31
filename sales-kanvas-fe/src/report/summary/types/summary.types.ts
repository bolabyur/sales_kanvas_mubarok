export type SummarySale = {
  periode: {
    start: string;
    end: string;
  };
  total_invoice: number;
  penjualan_bruto: number;
  total_retur: number;
  penjualan_neto: number;
  
  total_kasbon: number; 
  total_piutang: number;

  rincian_pembayaran: {
    tipe: string;
    total: number;
  }[];
};

export type SummarySaleZona = {
  market_area_id: number;
  nama_zona: string;
  total_invoice: number;
  total_penjualan: number;
};

export type SummaryRekonsiliasi = {
  ringkasan: {
    total_saldo_piutang: number;
    total_piutang_menunggak: number;
    jumlah_outlet_menunggak: number;
  };
  daftar_piutang: {
    invoice_id: number;
    outlet: string;
    zona: string;
    tgl_invoice: string;
    jatuh_tempo: string;
    sisa_piutang: number;
    status: string;
  }[];
};