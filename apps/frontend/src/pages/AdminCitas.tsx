import { AuthGate, AdminOnly } from "@/components/auth/AuthGate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminAppointments from "@/components/appointments/AdminAppointments";

export default function AdminCitas() {
  const navigate = useNavigate();

  return (
    <AuthGate>
      <AdminOnly>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Administración de Citas</h1>
                <p className="text-gray-600 mt-2">Gestiona las citas y horarios de la clínica</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </div>
          </div>
          <AdminAppointments />
        </div>
      </AdminOnly>
    </AuthGate>
  );
}
