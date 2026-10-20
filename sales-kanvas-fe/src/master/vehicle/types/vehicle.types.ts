export type Vehicle = {
  id: number;
  name: string;
  type_vehicle: string;
  nopol: string;
  type_fuel: string;
  created_at: string;
  updated_at: string | null;
  user_id: number;
  ip: string;
};

export type VehiclePayload = {
  name: string;
  type_vehicle: string;
  nopol: string;
  type_fuel: string;
};
