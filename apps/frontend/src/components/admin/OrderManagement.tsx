// src/components/admin/OrderManagement.tsx - Gestión de órdenes para admin
import { useState } from "react";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { usePagination } from "@/hooks/usePagination";
import { getAllOrdersPaginated } from "@/services/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Filter, Search, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { OrderRow } from "@/components/admin/orders/OrderRow";
import { StatsCard } from "@/components/admin/orders/StatsCard";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderPagination from "@/components/admin/orders/OrderPagination";
import OrderDetailsContent from "@/components/admin/orders/OrderDetails";
import type { Order, OrderItem } from "@/types";

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // Estados para filtros temporales (antes de aplicar búsqueda)
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");
  const [tempDateFrom, setTempDateFrom] = useState<string>("");
  const [tempDateTo, setTempDateTo] = useState<string>("");
  // Usar hook genérico de paginación
  const {
    data: orders,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    isLoading,
    refresh,
  } = usePagination<Order>({
    key: ["orders"],
    fetcher: getAllOrdersPaginated,
    initialPage: 1,
    initialPageSize: 50,
    initialFilters: {
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });

  const updateStatusMutation = useUpdateOrderStatus();

  // Función para aplicar filtros
  const applyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setStatusFilter(tempStatusFilter);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setFilters({
      status: tempStatusFilter !== "all" ? tempStatusFilter : undefined,
      search: tempSearchTerm || undefined,
      dateFrom: tempDateFrom || undefined,
      dateTo: tempDateTo || undefined,
    });
    setPage(1);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setTempSearchTerm("");
    setTempStatusFilter("all");
    setTempDateFrom("");
    setTempDateTo("");
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setFilters({});
    setPage(1);
  };

  // No necesitamos filtrado local ya que viene del backend
  const filteredOrders = orders;

  // Para contar por estado, necesitamos una consulta separada o estimación
  // Por ahora usamos los datos actuales
  const statusCounts = {
    all: totalCount,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    ready_for_pickup: orders.filter((o) => o.status === "ready_for_pickup").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const handleUpdateStatus = async (orderId: string) => {
    if (!newStatus) return;

    await updateStatusMutation.mutateAsync({
      orderId,
      status: newStatus as Order["status"],
      adminNotes: adminNotes || undefined,
    });

    setSelectedOrder(null);
    setNewStatus("");
    setAdminNotes("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      confirmed: { variant: "default", label: "Confirmado" },
      processing: { variant: "default", label: "Procesando" },
      ready_for_pickup: { variant: "default", label: "Listo para Recojo" },
      shipped: { variant: "default", label: "Enviado" },
      delivered: { variant: "default", label: "Entregado" },
      cancelled: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">Administra todos los pedidos de la tienda</p>
        </div>
        <Button onClick={() => refresh()} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard title="Todos" value={statusCounts.all} />
        <StatsCard title="Pendientes" value={statusCounts.pending} variant="warning" />
        <StatsCard title="Confirmados" value={statusCounts.confirmed} variant="info" />
        <StatsCard title="Procesando" value={statusCounts.processing} variant="info" />
        <StatsCard title="Listo Recojo" value={statusCounts.ready_for_pickup} variant="success" />
        <StatsCard title="Enviados" value={statusCounts.shipped} variant="success" />
        <StatsCard title="Entregados" value={statusCounts.delivered} variant="success" />
      </div>

      {/* Filters */}
      <OrderFilters
        tempSearchTerm={tempSearchTerm}
        setTempSearchTerm={setTempSearchTerm}
        tempStatusFilter={tempStatusFilter}
        setTempStatusFilter={setTempStatusFilter}
        tempDateFrom={tempDateFrom}
        setTempDateFrom={setTempDateFrom}
        tempDateTo={tempDateTo}
        setTempDateTo={setTempDateTo}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
      />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({totalCount} totales)</CardTitle>
          <CardDescription>
            Página {page} de {totalPages} • Mostrando {orders.length} pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => <OrderRow key={order.id} order={order} onView={(o) => setSelectedOrder(o)} />)
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No se encontraron pedidos</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <OrderPagination
              page={page}
              totalPages={totalPages}
              ordersLength={orders.length}
              totalCount={totalCount}
              setPage={setPage}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}
      {/* Detalles del pedido en un único diálogo controlado por selectedOrder */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <OrderDetailsContent
              order={selectedOrder}
              newStatus={newStatus}
              setNewStatus={setNewStatus}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
              onUpdateStatus={async () => {
                await handleUpdateStatus(selectedOrder.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
