/**
 * useProfile - Hook para gestionar el perfil del usuario
 * Usa el API Gateway para todas las operaciones
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/auth";
import { getProfile, updateProfile, updateAddress, updatePhone, isAdmin, type Profile } from "@/services/profile";

/**
 * Hook para obtener el perfil del usuario actual
 */
export function useProfile() {
  const { user } = useUser();

  return useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para actualizar el perfil
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: (data: Partial<Profile>) => updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "✅ Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
        duration: 3000,
      });
      return updatedProfile;
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al actualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para actualizar la dirección
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: (address: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }) =>
      updateAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "✅ Dirección actualizada",
        description: "Tu dirección ha sido actualizada",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al actualizar dirección",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para actualizar el teléfono
 */
export function useUpdatePhone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: (phone: string) => updatePhone(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "✅ Teléfono actualizado",
        description: "Tu número de teléfono ha sido actualizado",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al actualizar teléfono",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para verificar si el usuario es admin
 */
export function useIsAdmin() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["profile", "isAdmin", user?.id],
    queryFn: isAdmin,
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hora (el rol no cambia frecuentemente)
  });
}

// Re-export types
export type { Profile } from "@/services/profile";
