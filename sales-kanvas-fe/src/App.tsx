import { Route, Routes } from "react-router-dom";
import { LoginPage } from "@/auth/components/login-page";
import { RequireAuth } from "@/auth/components/require-auth";
import { RequirePermission } from "@/auth/components/require-permission";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DashboardPage } from "@/dashboard/components/dashboard-page";
import { EmployeePage } from "@/master/employee/components/employee-page";
import { KasbonMaterialTypePage } from "@/master/kasbon-material-type/components/kasbon-material-type-page";
import { MarketAreaPage } from "@/master/market-area/components/market-area-page";
import { ProductPage } from "@/master/product/components/product-page";
import { VehiclePage } from "@/master/vehicle/components/vehicle-page";
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

          <Route element={<RequirePermission permission="plan:read" />}>
            <Route path="/plan" element={<PlanListPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
            <Route element={<RequirePermission permission="plan:write" />}>
              <Route path="/plan/new" element={<PlanFormPage />} />
              <Route path="/plan/:id/edit" element={<PlanFormPage />} />
            </Route>
          </Route>

          <Route path="/master/employee" element={<EmployeePage />} />
          <Route path="/master/market-area" element={<MarketAreaPage />} />
          <Route path="/master/product" element={<ProductPage />} />
          <Route path="/master/vehicle" element={<VehiclePage />} />
          <Route
            path="/master/kasbon-material-type"
            element={<KasbonMaterialTypePage />}
          />

          <Route
            path="*"
            element={
              <p className="text-sm text-muted-foreground">
                Halaman tidak ditemukan.
              </p>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
