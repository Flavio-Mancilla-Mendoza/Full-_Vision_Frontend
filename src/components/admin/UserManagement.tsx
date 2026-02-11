import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsersPaginated } from "@/services/users";
import { validateUserForm } from "@full-vision/shared";
import type { CreateUserData, UpdateUserData } from "@full-vision/shared";
import type { UserProfile } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import { UserRow } from "@/components/admin/users/UserRow";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useUserManagement } from "@/hooks/useUserManagement";

function UserManagementInner() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación de usuarios
  const {
    data: pagedUsers,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    isLoading: isUsersLoading,
    refresh,
  } = usePagination<UserProfile>({
    key: ["users"],
    fetcher: getAllUsersPaginated,
    initialPage: 1,
    initialPageSize: 25,
    initialFilters: { search: "" },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
    email: "",
    password: "",
    full_name: "",
    role: "customer",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const { isSubmitting, submitForm, handleDelete } = useUserManagement();

  // Sync paged data into local state for form validations
  useEffect(() => {
    if (pagedUsers.length > 0 || !isUsersLoading) {
      setUsers(pagedUsers);
    }
  }, [pagedUsers, isUsersLoading]);

  // Sync loading state
  useEffect(() => {
    setLoading(isUsersLoading);
  }, [isUsersLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    const isValid = await validateForm();
    if (!isValid) return;

    // Confirmación especial para crear admin
    if (!editingUser && (formData as CreateUserData).role === "admin") {
      setShowAdminConfirm(true);
      return;
    }

    await submitForm(formData, editingUser, {
      closeDialog: () => setIsDialogOpen(false),
      resetForm,
      refresh,
      setShowAdminConfirm,
    });
  };

  // handleDelete provided by hook: pass refresh when assigning to rows

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: (user.role as "admin" | "customer") ?? "customer",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "customer",
    });
    setFormErrors({});
    setShowAdminConfirm(false);
  };

  // Validaciones (delegadas a lib para evitar lógica de negocio en el componente)
  const validateForm = async (): Promise<boolean> => {
    const existingEmails = (users || []).map((u) => u.email).filter((e): e is string => !!e);
    const { valid, errors } = validateUserForm(formData, existingEmails, !editingUser);
    setFormErrors(errors);
    return valid;
  };

  // Usar resultados paginados del servidor
  const filteredUsers = users || [];

  // Actualizar filtros cuando cambie el searchTerm
  useEffect(() => {
    setFilters({ search: searchTerm || undefined });
    setPage(1);
  }, [searchTerm, setFilters, setPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Administra los usuarios del sistema</CardDescription>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchBar value={searchTerm} onDebouncedChange={setSearchTerm} placeholder="Buscar usuarios..." />
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Modifica los datos del usuario" : "Completa el formulario para crear un nuevo usuario"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {!editingUser && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={(formData as CreateUserData).email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          autoComplete="email"
                          required
                          className={formErrors.email ? "border-red-500" : ""}
                        />
                        {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          value={(formData as CreateUserData).password || ""}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          autoComplete="new-password"
                          required
                          className={formErrors.password ? "border-red-500" : ""}
                        />
                        {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
                        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con mayúscula, minúscula y número</p>
                      </div>
                    </>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      autoComplete="name"
                      required
                      className={formErrors.full_name ? "border-red-500" : ""}
                    />
                    {formErrors.full_name && <p className="text-sm text-red-500">{formErrors.full_name}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "customer" })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="customer">Cliente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Procesando..." : editingUser ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Diálogo de confirmación para crear admin */}
          <Dialog open={showAdminConfirm} onOpenChange={setShowAdminConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar creación de Administrador</DialogTitle>
                <DialogDescription>
                  Estás a punto de crear un usuario con permisos de administrador. Esto le dará acceso completo al sistema de gestión.
                  <br />
                  <br />
                  <strong>Email:</strong> {(formData as CreateUserData).email}
                  <br />
                  <strong>Nombre:</strong> {formData.full_name}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdminConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    submitForm(formData, editingUser, {
                      closeDialog: () => setIsDialogOpen(false),
                      resetForm,
                      refresh,
                      setShowAdminConfirm,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creando..." : "Confirmar Creación"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando usuarios...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} onEdit={handleEdit} onDelete={(id: string) => handleDelete(id, refresh)} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {totalPages > 1 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1 || isUsersLoading}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <div className="text-sm">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                <span className="text-muted-foreground ml-2">— {totalCount} usuarios</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isUsersLoading}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">Tamaño:</div>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  const n = parseInt(v, 10);
                  setPageSize(n);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export const UserManagement: React.FC = () => (
  <ConfirmProvider>
    <UserManagementInner />
  </ConfirmProvider>
);
