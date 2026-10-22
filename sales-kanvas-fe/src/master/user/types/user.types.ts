export type Role = { id: number; name: string };

export type User = {
  id: number;
  name: string;
  username: string;
  is_active: boolean;
  karyawan_id: number;
  role_id: number;
  role: Role;
  created_at?: string;
  updated_at?: string | null;
};

export type UserPayload = Omit<User, "id" | "role" | "created_at" | "updated_at"> & {
  password?: string;
};