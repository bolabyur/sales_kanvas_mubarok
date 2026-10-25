import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Truck,
  Users,
  Tags,
  Store,
  Warehouse,
  Boxes,
  Shield,
  Key,
  UserCog,
  FileText,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
};

export const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Umum",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Transaksi",
    items: [
      {
        title: "Sales Kanvas Plan",
        url: "/plan",
        icon: ClipboardList,
        permission: "plan:read",
      },
      {
        title: "BON Barang",
        url: "/transaksi/kasbon-produk",
        icon: FileText,
        permission: "kasbon-produk:read",
      },
      {
        title: "Loading (Produk Out)",
        url: "/transaksi/produk-out",
        icon: Truck,
        permission: "produk-out:read",
      },
      {
        title: "Unloading (Produk In)",
        url: "/transaksi/produk-in",
        icon: PackageOpen,
        permission: "produk-in:read",
      },
    ],
  },
  {
    label: "Master",
    items: [
      {
        title: "Karyawan",
        url: "/master/employee",
        icon: Users,
        permission: "employee:read",
      },
      {
        title: "Kendaraan",
        url: "/master/vehicle",
        icon: Truck,
        permission: "vehicle:read",
      },
      {
        title: "Market Area",
        url: "/master/market-area",
        icon: MapPin,
        permission: "market-area:read",
      },
      {
        title: "Produk",
        url: "/master/product",
        icon: Package,
        permission: "product:read",
      },
      {
        title: "Tipe Harga",
        url: "/master/tipe-harga",
        icon: Tags,
        permission: "tipe-harga:read",
      },
      {
        title: "Outlet / Toko",
        url: "/master/outlet",
        icon: Store,
        permission: "outlet:read",
      },
      {
        title: "Gudang",
        url: "/master/gudang",
        icon: Warehouse,
        permission: "gudang:read",
      },
      {
        title: "Batch & Expired",
        url: "/master/batch",
        icon: Boxes,
        permission: "batch:read",
      },
      {
        title: "Manajemen User",
        url: "/master/user",
        icon: UserCog,
        permission: "user:read",
      },
      {
        title: "Manajemen Role",
        url: "/master/role",
        icon: Shield,
        permission: "role:read",
      },
      {
        title: "Data Permission",
        url: "/master/permission",
        icon: Key,
        permission: "permission:read",
      },
    ],
  },
];

export const isActive = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);
