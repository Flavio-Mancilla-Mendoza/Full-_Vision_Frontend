import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

// ⚠️ CRÍTICO: Configurar Amplify PRIMERO - Se ejecuta síncronamente
import "./lib/amplify-setup";

// Test de variables de entorno (temporal)
// import "./test-env";

// Test de Supabase (temporal)
// import "./utils/test-supabase";

// Test de productos CORREGIDO (sin brand) - FUNCIONANDO
// import "./services/products-fixed";

// Optimizaciones de performance críticas
import { initializePerformanceOptimizations, enhancedWebVitalsMonitoring } from "@/utils/performance-optimizer";

// Ejecutar optimizaciones antes de renderizar
initializePerformanceOptimizations();

// Monitoreo de performance
if (import.meta.env.DEV) {
  enhancedWebVitalsMonitoring();
}

createRoot(document.getElementById("root")!).render(
  <ConfirmProvider>
    <App />
  </ConfirmProvider>
);
