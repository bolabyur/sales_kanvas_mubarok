export type Permission = { id: number; name: string };

export type Role = {
  id: number;
  name: string;
  permissionRoles: { permission: Permission }[];
};

export type RolePayload = {
  name: string;
  permissionIds: number[];
};
