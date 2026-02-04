// Ejemplo de implementación con paginación - OrderManagement.tsx
// Este es un ejemplo de cómo actualizar el componente para usar paginación

import { useState } from "react";
import { useOrdersPaginated, useUpdateOrderStatus } from "@/hooks/useOrders";
// ... otros imports

export function OrderManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // Usar hook con paginación
  const { data, isLoading, refetch } = useOrdersPaginated(currentPage, pageSize, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm || undefined,
  });

  const orders = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = data?.totalPages ?? 1;

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

  // ... resto del componente igual

  return (
    <div className="space-y-6">
      {/* Header con info de paginación */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">
            {totalCount} pedidos totales • Página {currentPage} de {totalPages}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por número, nombre o email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset a página 1 al buscar
          }}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({statusCounts.all})</SelectItem>
            <SelectItem value="pending">Pendientes ({statusCounts.pending})</SelectItem>
            <SelectItem value="confirmed">Confirmados ({statusCounts.confirmed})</SelectItem>
            <SelectItem value="processing">Procesando ({statusCounts.processing})</SelectItem>
            <SelectItem value="ready_for_pickup">Listos para Recojo ({statusCounts.ready_for_pickup})</SelectItem>
            <SelectItem value="shipped">Enviados ({statusCounts.shipped})</SelectItem>
            <SelectItem value="delivered">Entregados ({statusCounts.delivered})</SelectItem>
            <SelectItem value="cancelled">Cancelados ({statusCounts.cancelled})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de pedidos */}
      {/* ... tabla igual ... */}

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {orders.length} de {totalCount} pedidos
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Anterior
          </Button>
          <span className="flex items-center px-3 py-1 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
