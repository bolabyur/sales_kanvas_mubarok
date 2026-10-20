export type User = {
  id: number;
  role_id: number;
  username: string;
  name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  role: { id: number; name: string };
  permissions: { id: number; name: string }[];
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};
