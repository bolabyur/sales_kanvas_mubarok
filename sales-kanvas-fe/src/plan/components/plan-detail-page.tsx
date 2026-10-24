import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Truck, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { usePlan } from "../hooks/usePlan";
import { PlanStatusBadge } from "./plan-status-badge";

export function PlanDetailPage() {
  const planId = Number(useParams().id);
  const { data: plan, isLoading, isError } = usePlan(planId);

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Memuat data rincian...</div>;
  if (isError || !plan) return <div className="p-10 text-center text-red-500">Rencana Kanvas tidak ditemukan.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link to="/plan" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{plan.invoice}</h1>
            <PlanStatusBadge status={plan.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dibuat pada: {formatDate(plan.tgl_invoice)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Perjalanan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Tanggal Perjalanan</p>
              <p className="text-sm text-muted-foreground">{formatDate(plan.tgl_pergi_kanvas)} s/d {plan.tgl_kembali_kanvas ? formatDate(plan.tgl_kembali_kanvas) : "Selesai"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Wilayah Pasar</p>
              <p className="text-sm text-muted-foreground">{plan.marketArea?.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Kendaraan</p>
              <p className="text-sm text-muted-foreground">{plan.vehicle?.nopol} - {plan.vehicle?.name}</p>
            </div>
          </div>
          {plan.note && (
            <div className="md:col-span-3 bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium">Catatan:</p>
              <p className="text-sm text-muted-foreground">{plan.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Tim Bertugas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.salesKanvasPersonil?.length ? (
                  plan.salesKanvasPersonil.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.employee?.name}</TableCell>
                      <TableCell>{p.position}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-center">Tidak ada personil.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Barang Dibawa</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.salesKanvasPlanDetail?.length ? (
                  plan.salesKanvasPlanDetail.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.product?.name}</TableCell>
                      <TableCell className="text-right">{d.qty}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-center">Tidak ada produk.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}