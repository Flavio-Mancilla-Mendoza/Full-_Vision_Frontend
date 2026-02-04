import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser, useSession, getProfile } from "@/hooks/useAuthCognito";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Calendar, LogOut, Eye, Home } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: "admin" | "customer";
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const { user: currentUser, session: userSession, loading: authLoading, isAuthenticated, refreshProfile } = useUser();
  const { session: directSession, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Usar la sesión directa como fallback
  const session = userSession || directSession;

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      setLoading(true);
      // Si ya tenemos datos del usuario desde useUser, usarlos
      setProfile({
        ...currentUser,
        email: session?.user?.email,
      });
      setFormData({
        full_name: currentUser.full_name || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, session?.user?.email, toast, isAuthenticated]);

  useEffect(() => {
    // No redirigir mientras está cargando cualquiera de las dos sesiones
    if (authLoading || sessionLoading) {
      return;
    }

    // Verificar directamente la sesión
    if (!session) {
      navigate("/login");
      return;
    }

    // Si tenemos sesión, cargar el perfil cuando tengamos datos del usuario
    if (currentUser) {
      loadProfile();
      setEditing(false); // Siempre inicia en modo solo lectura
    }
  }, [session, userSession, directSession, navigate, loadProfile, authLoading, sessionLoading, currentUser, isAuthenticated]);

  const updateProfile = async () => {
    if (!session?.user?.id) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          address: formData.address || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      // ✅ Invalidar caché y refrescar datos del usuario
      if (refreshProfile) {
        refreshProfile();
      }

      // Actualizar estado local también
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name || null,
              phone: formData.phone || null,
              address: formData.address || null,
            }
          : null
      );

      setEditing(false); // Salir del modo edición

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
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
        description: "No se pudo cerrar la sesión",
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No se pudo cargar el perfil</p>
            <Button onClick={() => navigate("/")}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/")} className="gap-2 flex-1 sm:flex-initial">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Volver al inicio</span>
                <span className="sm:hidden">Inicio</span>
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2 flex-1 sm:flex-initial">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            </div>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={profile.full_name || "Usuario"} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h2 className="text-2xl font-semibold">{profile.full_name || "Usuario sin nombre"}</h2>
                    <Badge variant={profile.role === "admin" ? "default" : "secondary"} className="w-fit">
                      {profile.role === "admin" ? "Administrador" : "Cliente"}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Profile - modo solo lectura y edición */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  {editing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Ingresa tu nombre completo"
                    />
                  ) : (
                    <Input id="full_name" value={profile.full_name || ""} disabled className="bg-muted" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Número de teléfono"
                    />
                  ) : (
                    <Input id="phone" value={profile.phone || ""} disabled className="bg-muted" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  {editing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Dirección completa"
                    />
                  ) : (
                    <Input id="address" value={profile.address || ""} disabled className="bg-muted" />
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        loadProfile();
                        setEditing(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        await updateProfile();
                        setEditing(false);
                      }}
                      disabled={updating}
                    >
                      {updating ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)}>Modificar</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/mis-pedidos")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Eye className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Mis Pedidos</h3>
                    <p className="text-sm text-muted-foreground">Ver historial de compras</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Direcciones</h3>
                    <p className="text-sm text-muted-foreground">Gestionar direcciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/citas")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Citas</h3>
                    <p className="text-sm text-muted-foreground">Agendar examen de vista</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
