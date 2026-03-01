// Hook que encapsula toda la lógica del Navbar
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/auth";
import { useAppointments } from "@/hooks/useAppointments";
import { useCartCount as useAuthCartCount } from "@/hooks/cart";
import { useToast } from "@/hooks/use-toast";
import { NAV_CONFIG, type NavItem } from "@/components/layout/navbar-config";

export function useNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useUser();
  const { pendingAppointments } = useAppointments();
  const { count: cartItemCount = 0 } = useAuthCartCount();
  const { toast } = useToast();

  const isAdmin = useMemo(() => {
    return isAuthenticated && user?.role === "admin";
  }, [isAuthenticated, user?.role]);

  const navItems: NavItem[] = useMemo(() => {
    return NAV_CONFIG.filter((item) => {
      if (item.requiresAuth && !isAuthenticated) return false;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [isAuthenticated, isAdmin]);

  const handleNavClick = useCallback(
    (itemLabel: string) => {
      setIsMenuOpen(false);
      const navItem = NAV_CONFIG.find((item) => item.label === itemLabel);
      if (navItem?.path) {
        navigate(navItem.path);
      }
    },
    [navigate]
  );

  const handleSignOut = useCallback(async () => {
    try {
      const { logoutUser } = await import("@/services/cognito-auth");
      const result = await logoutUser();

      if (!result.success) {
        throw new Error(result.error);
      }

      navigate("/");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al cerrar sesión",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const handleProfileClick = useCallback(() => {
    if (loading) return;

    if (isAuthenticated) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  return {
    // Estado
    isMenuOpen,
    isSearchOpen,
    loading,
    user,
    isAuthenticated,
    isAdmin,
    navItems,
    pendingAppointments,
    cartItemCount,

    // Acciones
    handleNavClick,
    handleSignOut,
    handleProfileClick,
    toggleMenu,
    openSearch,
    closeSearch,
    navigate,
  };
}
