import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateUserData, UpdateUserData } from "@/lib/user-validators";

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateUserData | UpdateUserData;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  onOpenChange,
  formData,
  isSubmitting,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
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
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Confirmar Creación"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
