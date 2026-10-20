export type MarketArea = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
  user_id: number;
  ip: string;
};

export type MarketAreaPayload = {
  name: string;
};
