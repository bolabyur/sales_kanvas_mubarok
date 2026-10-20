export type Gender = "MALE" | "FEMALE";

export type Employee = {
  id: number;
  avatar_file_id: number | null;
  name: string;
  nip: string | null;
  pin_fingerprint: string | null;
  contact: string | null;
  address: string | null;
  tipe_upah_id: number | null;
  employee_position_id: number;
  employee_job_id: number;
  employee_contract_id: number;
  devisi_id: number;
  gender: Gender;
  agama: string;
  tgl_lahir: string;
  tgl_masuk: string;
  hari_libur_mingguan: number | null;
  jam_kerja_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  user_id: number;
  ip: string;
};

export type EmployeePayload = Omit<
  Employee,
  "id" | "avatar_file_id" | "created_at" | "updated_at" | "user_id" | "ip"
>;
