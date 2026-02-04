// src/components/appointments/AdminAppointments.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, List, Settings, ArrowLeft } from "lucide-react";
import AppointmentCalendar from "./AppointmentCalendar";
import AppointmentStats from "./AppointmentStats";
import AdminAppointmentsList from "./AdminAppointmentsList";
import { PerformanceWrapper } from "@/lib/performance";

interface AdminAppointmentsProps {
  className?: string;
  maxItems?: number;
}

export default function AdminAppointments({ className, maxItems }: AdminAppointmentsProps) {
  const [activeTab, setActiveTab] = useState("list");
  const navigate = useNavigate();

  return (
    <PerformanceWrapper componentName="AdminAppointments">
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Panel de Administración de Citas
              </CardTitle>
              <Button variant="outline" onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Lista de Citas
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Estadísticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-6">
                <AdminAppointmentsList maxItems={maxItems} />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <AppointmentCalendar />
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <AppointmentStats />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PerformanceWrapper>
  );
}
