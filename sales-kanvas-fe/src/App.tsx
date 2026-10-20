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

import { PlanDetailPage } from "@/plan/components/plan-detail-page";
import { PlanFormPage } from "@/plan/components/plan-form-page";
import { PlanListPage } from "@/plan/components/plan-list-page";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="/master/product" element={<ProductPage />} />
          <Route path="/master/tipe-harga" element={<TipeHargaPage />} />
          
          <Route path="/master/outlet" element={<OutletPage />} />
          <Route path="/master/gudang" element={<GudangPage />} />
          <Route path="/master/batch" element={<BatchPage />} />
          
          <Route path="/master/employee" element={<EmployeePage />} />
          <Route path="/master/vehicle" element={<VehiclePage />} />
          <Route path="/master/market-area" element={<MarketAreaPage />} />

          <Route element={<RequirePermission permission="plan:read" />}>
            <Route path="/plan" element={<PlanListPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
            <Route element={<RequirePermission permission="plan:write" />}>
              <Route path="/plan/new" element={<PlanFormPage />} />
              <Route path="/plan/:id/edit" element={<PlanFormPage />} />
            </Route>
          </Route>

          <Route path="/transaksi/kasbon-produk" element={<div className="p-6">Halaman BON Barang (Belum Dibuat)</div>} />
          <Route path="/transaksi/produk-out" element={<div className="p-6">Halaman Loading (Belum Dibuat)</div>} />
          <Route path="/transaksi/invoice" element={<div className="p-6">Halaman Invoice (Belum Dibuat)</div>} />
          <Route path="/transaksi/pembayaran" element={<div className="p-6">Halaman Pembayaran (Belum Dibuat)</div>} />
          <Route path="/transaksi/retur" element={<div className="p-6">Halaman Retur (Belum Dibuat)</div>} />
          <Route path="/transaksi/produk-in" element={<div className="p-6">Halaman Unloading (Belum Dibuat)</div>} />
          <Route path="/transaksi/settlement" element={<div className="p-6">Halaman Settlement (Belum Dibuat)</div>} />

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