// Menú de navegación móvil
import { User, LogIn, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/components/layout/navbar-utils";
import type { NavItem } from "@/components/layout/navbar-config";

interface NavbarUser {
  full_name: string | null;
  email?: string;
  role: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  user: NavbarUser | null;
  isAuthenticated: boolean;
  pendingAppointments: { length: number };
  cartItemCount: number;
  onNavClick: (label: string) => void;
  onProfileClick: () => void;
  onSignOut: () => void;
  onNavigate: (path: string) => void;
}

export function MobileMenu({
  isOpen,
  navItems,
  user,
  isAuthenticated,
  pendingAppointments,
  cartItemCount,
  onNavClick,
  onProfileClick,
  onSignOut,
  onNavigate,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden py-4 border-t border-border animate-fade-in">
      <div className="flex flex-col space-y-3">
        {/* Navigation items */}
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavClick(item.label)}
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

        {/* User section */}
        <div className="pt-2 border-t border-border">
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user.full_name || "Usuario"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.full_name || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={onProfileClick}
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => onNavigate("/mis-citas")}
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
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
              onClick={onProfileClick}
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión / Registrarse
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="pt-2">
          <Input type="search" placeholder="Buscar..." className="w-full" />
        </div>
      </div>
    </div>
  );
}
