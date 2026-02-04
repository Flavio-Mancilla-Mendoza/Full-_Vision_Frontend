import { useState, useMemo } from "react";
import { Search, User, HelpCircle, Menu, X, LogIn, LogOut, Calendar, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useAuthCognito";
import { useAppointments } from "@/hooks/useAppointments";
import { useOptimizedAuthCartCount as useAuthCartCount } from "@/hooks/useOptimizedAuthCart";
import CartDrawer from "@/components/cart/CartDrawer";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Configuración optimizada de navegación
interface NavItem {
  label: string;
  path?: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const NAV_CONFIG: NavItem[] = [
  { label: "Hombres", path: "/hombres" },
  { label: "Mujeres", path: "/mujer" },
  { label: "Niños", path: "/ninos" },
  // { label: "Lentes de contacto", path: "/lentes-contacto" }, // Temporalmente oculto
  { label: "Examen de vista", path: "/citas", requiresAuth: true },
  { label: "Mis Citas", path: "/mis-citas", requiresAuth: true },
  { label: "Mis Pedidos", path: "/mis-pedidos", requiresAuth: true },
  { label: "Carrito", path: "/cart", requiresAuth: true },
  { label: "Admin", path: "/admin/dashboard", requiresAuth: true, adminOnly: true },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useUser();
  const { pendingAppointments } = useAppointments();
  const { count: cartItemCount = 0, isAuthenticated: isAuthenticatedForCart } = useAuthCartCount();
  const { toast } = useToast();

  // Determinar si es admin directamente desde el user object para evitar hook adicional
  const isAdmin = useMemo(() => {
    return isAuthenticated && user?.role === "admin";
  }, [isAuthenticated, user?.role]);

  // Optimizar filtrado de items de navegación
  const navItems = useMemo(() => {
    return NAV_CONFIG.filter((item) => {
      // Si requiere autenticación y no está autenticado, no mostrar
      if (item.requiresAuth && !isAuthenticated) return false;
      // Si es solo para admin y no es admin, no mostrar
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [isAuthenticated, isAdmin]);

  const handleNavClick = (itemLabel: string) => {
    // Cerrar menú móvil
    setIsMenuOpen(false);

    // Buscar el item en la configuración
    const navItem = NAV_CONFIG.find((item) => item.label === itemLabel);

    if (navItem?.path) {
      navigate(navItem.path);
    }
  };

  const handleProfileClick = () => {
    if (loading) return; // No hacer nada si está cargando

    if (isAuthenticated && user) {
      // Solo navegar si tenemos usuario confirmado
      navigate("/profile");
    } else if (isAuthenticated && !user) {
      // Si hay sesión pero no usuario, probablemente hay un error
      toast({
        title: "Error de sesión",
        description: "Hay un problema con tu sesión. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      });
      // Forzar logout
      handleSignOut();
    } else {
      navigate("/login");
    }
  };

  const handleSignOut = async () => {
    try {
      // Importar dinámicamente el servicio de Cognito
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
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Full Vision</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.label)}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200 hover:scale-105 transform relative"
              >
                <span>{item.label}</span>
                {item.label === "Mis Citas" && pendingAppointments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {pendingAppointments.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center space-x-2 animate-fade-in">
                  <Input type="search" placeholder="Buscar..." className="w-48 h-9" autoFocus />
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Cart - available for all users */}
            <Tooltip>
              <TooltipTrigger asChild>
                <CartDrawer>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <ShoppingCart className="h-4 w-4" />
                    {cartItemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center p-0"
                      >
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </CartDrawer>
              </TooltipTrigger>
              <TooltipContent>
                <p>Carrito {cartItemCount > 0 ? `(${cartItemCount})` : ""}</p>
              </TooltipContent>
            </Tooltip>

            {/* Help */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Profile - Moved to the far right */}
            {loading ? (
              <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.full_name || "Usuario"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/mis-pedidos")} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Mis Pedidos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/mis-citas")} className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <div className="flex items-center justify-between w-full">
                      <span>Mis Citas</span>
                      {pendingAppointments.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 text-xs">
                          {pendingAppointments.length}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")} className="cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleProfileClick}>
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Iniciar Sesión / Registrarse</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label)}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2 text-left flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  {item.label === "Mis Citas" && pendingAppointments.length > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {pendingAppointments.length}
                    </Badge>
                  )}
                  {item.label === "Carrito" && cartItemCount > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Badge>
                  )}
                </button>
              ))}
              <div className="pt-2 border-t border-border">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={user.full_name || "Usuario"} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                      onClick={handleProfileClick}
                    >
                      <User className="h-4 w-4" />
                      Mi Perfil
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                      onClick={() => navigate("/mis-citas")}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Mis Citas
                      </div>
                      {pendingAppointments.length > 0 && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          {pendingAppointments.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                    onClick={handleProfileClick}
                  >
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión / Registrarse
                  </Button>
                )}
              </div>
              <div className="pt-2">
                <Input type="search" placeholder="Buscar..." className="w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
