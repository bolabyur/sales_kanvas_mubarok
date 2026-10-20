import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Truck,
  Users,
  Wallet,
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
    ],
  },
  {
    label: "Master",
    items: [
      { title: "Karyawan", url: "/master/employee", icon: Users },
      { title: "Market Area", url: "/master/market-area", icon: MapPin },
      { title: "Produk", url: "/master/product", icon: Package },
      { title: "Kendaraan", url: "/master/vehicle", icon: Truck },
      {
        title: "Jenis Kasbon Material",
        url: "/master/kasbon-material-type",
        icon: Wallet,
      },
    ],
  },
];

export const isActive = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);
