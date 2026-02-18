// src/pages/Citas.tsx
import CreateAppointmentForm from "@/components/appointments/CreateAppointmentForm";
import { useUser } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Settings, Home, ChevronRight } from "lucide-react";

export default function Citas() {
  const { user } = useUser();
  const navigate = useNavigate();

  // Determinar si es admin directamente desde el user object
  const isAdmin = user?.role === "admin";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <button onClick={() => navigate("/")} className="flex items-center hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Examen de Vista</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isAdmin ? "Gestión de Citas" : "Agendar Examen de Vista"}</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Administra todas las citas de exámenes visuales" : "Reserva tu cita para un examen completo de la vista"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} variant="outline">
              Volver al inicio
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate("/admin/citas")} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Panel Admin
              </Button>
            )}
          </div>
        </div>

        {/* Contenido diferenciado */}
        {isAdmin ? <AdminCitasOverview /> : <ClientAppointmentView />}
      </div>
    </div>
  );
}

// Componente para vista de administrador
function AdminCitasOverview() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Panel Completo</CardTitle>
          <CardDescription>Accede al panel completo de administración de citas</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/admin/citas")} className="w-full">
            Ir al Panel Admin
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista de Cliente</CardTitle>
          <CardDescription>Ve la experiencia desde la perspectiva del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientAppointmentView />
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para vista de cliente
function ClientAppointmentView() {
  return (
    <div className="space-y-6">
      {/* Información sobre el servicio */}
      <Card>
        <CardHeader>
          <CardTitle>¿En qué consiste el examen?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Incluye:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Examen de agudeza visual</li>
                <li>• Evaluación de la salud ocular</li>
                <li>• Medición de graduación</li>
                <li>• Recomendaciones personalizadas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Duración:</h4>
              <p className="text-sm text-muted-foreground mb-2">30-45 minutos aproximadamente</p>
              <h4 className="font-semibold mb-2">Precio:</h4>
              <p className="text-lg font-bold text-primary">Gratuito*</p>
              <p className="text-xs text-muted-foreground">*Con la compra de lentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de reserva */}
      <CreateAppointmentForm />
    </div>
  );
}
