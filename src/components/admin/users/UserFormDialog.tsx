import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { CreateUserData, UpdateUserData } from "@/lib/user-validators";
import type { UserProfile } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserProfile | null;
  formData: CreateUserData | UpdateUserData;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  onFormChange: (data: CreateUserData | UpdateUserData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onOpenChange,
  editingUser,
  formData,
  formErrors,
  isSubmitting,
  onFormChange,
  onSubmit,
  onReset,
}) => (
  <Dialog
    open={open}
    onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) onReset();
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
      <form onSubmit={onSubmit}>
        <div className="grid gap-4 py-4">
          {!editingUser && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={(formData as CreateUserData).email || ""}
                  onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
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
                  onChange={(e) => onFormChange({ ...formData, password: e.target.value })}
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
              onChange={(e) => onFormChange({ ...formData, full_name: e.target.value })}
              autoComplete="name"
              required
              className={formErrors.full_name ? "border-red-500" : ""}
            />
            {formErrors.full_name && <p className="text-sm text-red-500">{formErrors.full_name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={formData.phone} onChange={(e) => onFormChange({ ...formData, phone: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => onFormChange({ ...formData, role: e.target.value as "admin" | "customer" })}
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
);
