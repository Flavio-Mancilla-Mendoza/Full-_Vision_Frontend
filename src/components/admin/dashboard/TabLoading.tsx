import React from "react";
import { Activity } from "lucide-react";

export const TabLoading: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
      <p>Cargando...</p>
    </div>
  </div>
);
