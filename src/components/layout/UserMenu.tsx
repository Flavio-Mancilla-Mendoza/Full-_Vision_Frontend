// Menú de usuario desktop (dropdown del avatar)
import { User, LogOut, Calendar, Package, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/components/layout/navbar-utils";

interface NavbarUser {
  full_name: string | null;
  email?: string;
  role: string;
}

interface UserMenuProps {
  user: NavbarUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  pendingAppointments: { length: number };
  onProfileClick: () => void;
  onSignOut: () => void;
  onNavigate: (path: string) => void;
}

export function UserMenu({
  user,
  isAuthenticated,
  loading,
  pendingAppointments,
  onProfileClick,
  onSignOut,
  onNavigate,
}: UserMenuProps) {
  // Loading skeleton
  if (loading) {
    return <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />;
  }

  // Authenticated user dropdown
  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.full_name || "Usuario"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(user.full_name)}
              </AvatarFallback>
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
          <DropdownMenuItem onClick={() => onNavigate("/profile")} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNavigate("/mis-pedidos")} className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            <span>Mis Pedidos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNavigate("/mis-citas")} className="cursor-pointer">
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
            <DropdownMenuItem onClick={() => onNavigate("/admin/dashboard")} className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not authenticated - login button
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onProfileClick}>
          <User className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Iniciar Sesión / Registrarse</p>
      </TooltipContent>
    </Tooltip>
  );
}
