export type DetailDestructionPayload = {
  batch_id: number;
  produk_id: number;
  qty_dimusnahkan: number;
};

export type ProdukDestructionPayload = {
  gudang_id: number;
  tgl_destruction: string;
  alasan: string;
  details: DetailDestructionPayload[];
};

export type ProdukDestruction = {
  id: number;
  gudang_id: number;
  tgl_destruction: string;
  status: string;
  alasan: string;
  gudang?: any;
  details?: any[];
};