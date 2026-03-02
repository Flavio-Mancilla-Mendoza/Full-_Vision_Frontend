import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/SearchBar";
import { ProductPagination } from "@/components/admin/products/ProductPagination";
import { UserFormDialog } from "@/components/admin/users/UserFormDialog";
import { AdminConfirmDialog } from "@/components/admin/users/AdminConfirmDialog";
import { UserTable } from "@/components/admin/users/UserTable";
import { getAllUsersPaginated } from "@/services/users";
import { validateUserForm } from "@/lib/user-validators";
import type { CreateUserData, UpdateUserData } from "@/lib/user-validators";
import type { UserProfile } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useUserManagement } from "@/hooks/useUserManagement";

const INITIAL_FORM: CreateUserData = {
  email: "",
  password: "",
  full_name: "",
  role: "customer",
};

function UserManagementInner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);

  const { isSubmitting, submitForm, handleDelete } = useUserManagement();

  const {
    data: users,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    setFilters,
    isLoading,
    refresh,
  } = usePagination<UserProfile>({
    key: ["users"],
    fetcher: getAllUsersPaginated,
    initialPage: 1,
    initialPageSize: 25,
    initialFilters: { search: "" },
  });

  // Sincronizar filtro de búsqueda
  useEffect(() => {
    setFilters({ search: searchTerm || undefined });
    setPage(1);
  }, [searchTerm, setFilters, setPage]);

  const callbacks = {
    closeDialog: () => setIsDialogOpen(false),
    resetForm: () => resetForm(),
    refresh,
    setShowAdminConfirm,
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setShowAdminConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const existingEmails = (users ?? []).map((u) => u.email).filter((e): e is string => !!e);
    const { valid, errors } = validateUserForm(formData, existingEmails, !editingUser);
    setFormErrors(errors);
    if (!valid) return;

    if (!editingUser && (formData as CreateUserData).role === "admin") {
      setShowAdminConfirm(true);
      return;
    }

    await submitForm(formData, editingUser, callbacks);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: (user.role as "admin" | "customer") ?? "customer",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Administra los usuarios del sistema</CardDescription>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchBar value={searchTerm} onDebouncedChange={setSearchTerm} placeholder="Buscar usuarios..." />
          </div>
          <UserFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            editingUser={editingUser}
            formData={formData}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            onReset={resetForm}
          />
          <AdminConfirmDialog
            open={showAdminConfirm}
            onOpenChange={setShowAdminConfirm}
            formData={formData}
            isSubmitting={isSubmitting}
            onConfirm={() => submitForm(formData, editingUser, callbacks)}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Cargando usuarios...</div>
        ) : (
          <UserTable users={users ?? []} onEdit={handleEdit} onDelete={(id) => handleDelete(id, refresh)} />
        )}
      </CardContent>

      {totalPages > 1 && (
        <div className="p-4 border-t">
          <ProductPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            isLoading={isLoading}
            itemLabel="usuarios"
          />
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
