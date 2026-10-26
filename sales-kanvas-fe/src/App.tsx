import { Route, Routes } from "react-router-dom";
import { LoginPage } from "@/auth/components/login-page";
import { RequireAuth } from "@/auth/components/require-auth";
import { RequirePermission } from "@/auth/components/require-permission";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DashboardPage } from "@/dashboard/components/dashboard-page";

import { EmployeePage } from "@/master/employee/components/employee-page";
import { MarketAreaPage } from "@/master/market-area/components/market-area-page";
import { ProductPage } from "@/master/product/components/product-page";
import { VehiclePage } from "@/master/vehicle/components/vehicle-page";
import { TipeHargaPage } from "./master/tipe-harga/components/tipe-harga-page";
import { GudangPage } from "./master/gudang/components/gudang-page";
import { OutletPage } from "./master/outlet/components/outlet-page";
import { BatchPage } from "@/master/batch/components/batch-page";
import { UserPage } from "@/master/user/components/user-page";
import { RolePage } from "@/master/role/components/role-page";
import { PermissionPage } from "@/master/permission/components/permission-page";

import { PlanPage } from "@/plan/components/plan-page";
import { PlanDetailPage } from "@/plan/components/plan-detail-page";

import { KasbonProdukPage } from "@/transaksi/kasbon-produk/components/kasbon-produk-page";
import { ProdukInPage } from "@/transaksi/produk-in/components/produk-in-page";
import { ProdukOutPage } from "@/transaksi/produk-out/components/produk-out-page";
import { KanvasReturnPage } from "@/transaksi/kanvas-return/components/kanvas-return-page";
import { ProdukDestructionPage } from "@/transaksi/produk-destruction/components/produk-destruction-page";
import { SettlementPage } from "@/transaksi/settlement/components/settlement-page";
import { PembayaranPage } from "@/transaksi/pembayaran/components/pembayaran-page";
import { InvoicePage } from "@/transaksi/invoice/components/invoice-page";
import { KasbonOperasionalPage } from "@/transaksi/kasbon-operasional/components/kasbon-operasional-page";
import { ReturPage } from "@/transaksi/retur/components/retur-page";

import { SummaryPage } from "@/report/summary/components/summary-page";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          {/* MASTER DATA ROUTES */}
          <Route path="/master/product" element={<ProductPage />} />
          <Route path="/master/tipe-harga" element={<TipeHargaPage />} />
          <Route path="/master/outlet" element={<OutletPage />} />
          <Route
            path="/master/gudang-utama"
            element={
              <GudangPage tipeGudang="Barang Jadi" title="Gudang Utama" />
            }
          />
          <Route
            path="/master/gudang-retur"
            element={<GudangPage tipeGudang="Retur" title="Gudang Retur" />}
          />{" "}
          <Route path="/master/batch" element={<BatchPage />} />
          <Route path="/master/employee" element={<EmployeePage />} />
          <Route path="/master/vehicle" element={<VehiclePage />} />
          <Route path="/master/market-area" element={<MarketAreaPage />} />
          {/* USER MANAGEMENT ROUTES */}
          <Route path="/master/user" element={<UserPage />} />
          <Route path="/master/role" element={<RolePage />} />
          <Route path="/master/permission" element={<PermissionPage />} />
          {/* PERENCANAAN ROUTES */}
          <Route element={<RequirePermission permission="plan:read" />}>
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
          </Route>
          {/* TRANSAKSI ROUTES */}
          <Route
            path="/transaksi/kasbon-produk"
            element={<KasbonProdukPage />}
          />
          <Route path="/transaksi/produk-out" element={<ProdukOutPage />} />
          <Route path="/transaksi/produk-in" element={<ProdukInPage />} />
          <Route
            path="/transaksi/kanvas-return"
            element={<KanvasReturnPage />}
          />
          <Route
            path="/transaksi/disposal-barang"
            element={<ProdukDestructionPage />}
          />
          <Route path="/transaksi/settlement" element={<SettlementPage />} />
          <Route path="/transaksi/pembayaran" element={<PembayaranPage />} />
          <Route
            path="/transaksi/kasbon-operasional"
            element={<KasbonOperasionalPage />}
          />
          {/* ROUTE INVOICE YANG BARU DITAMBAHKAN */}
          <Route path="/transaksi/invoice" element={<InvoicePage />} />
          <Route path="/transaksi/retur" element={<ReturPage />} />
          <Route path="/report/summary" element={<SummaryPage />} />
          <Route
            path="*"
            element={
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-lg font-semibold text-muted-foreground">
                  404 - Halaman tidak ditemukan.
                </p>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
