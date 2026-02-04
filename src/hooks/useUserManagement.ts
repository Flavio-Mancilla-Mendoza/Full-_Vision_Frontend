import { useState } from "react";
import { createUser, updateUser, deactivateUser } from "@/services/users";
import type { CreateUserData, UpdateUserData } from "@full-vision/shared";
import type { UserProfile } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/hooks/useConfirm";

export function useUserManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const confirm = useConfirm();

  const submitForm = async (
    formData: CreateUserData | UpdateUserData,
    editingUser: UserProfile | null,
    callbacks?: {
      closeDialog?: () => void;
      resetForm?: () => void;
      refresh?: () => void;
      setShowAdminConfirm?: (v: boolean) => void;
    },
  ) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const result = await updateUser(editingUser.id, formData as UpdateUserData);
        if (result.success) {
          toast({ title: "Usuario actualizado", description: result.message || "El usuario se actualizó correctamente" });
        } else {
          throw new Error(result.message || "Error desconocido al actualizar usuario");
        }
      } else {
        const result = await createUser(formData as CreateUserData);
        if (result.success) {
          toast({ title: "Usuario creado", description: result.message || "El usuario se creó correctamente" });
        } else {
          throw new Error(result.message || "Error desconocido al crear usuario");
        }
      }

      callbacks?.closeDialog?.();
      callbacks?.resetForm?.();
      callbacks?.refresh?.();
    } catch (error: unknown) {
      console.error("❌ useUserManagement: Error en operación:", error);
      let errorMessage = editingUser ? "No se pudo actualizar el usuario" : "No se pudo crear el usuario";

      if (error && typeof error === "object" && "message" in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage = (error as any).message;
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      callbacks?.setShowAdminConfirm?.(false);
    }
  };

  const handleDelete = async (id: string, refresh?: () => void) => {
    const shouldDeactivate = await confirm("¿Estás seguro de que quieres desactivar este usuario?");
    if (!shouldDeactivate) return;
    try {
      await deactivateUser(id);
      toast({ title: "Usuario desactivado", description: "El usuario se desactivó correctamente" });
      refresh?.();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo desactivar el usuario", variant: "destructive" });
    }
  };

  return { isSubmitting, submitForm, handleDelete } as const;
}
