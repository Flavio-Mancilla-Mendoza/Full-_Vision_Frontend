import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

// Amplify se inicializa de forma diferida para no bloquear el render inicial
// Se carga cuando se necesita auth (lazy import en AuthRequired)

// Test de variables de entorno (temporal)
// import "./test-env";

// Test de Supabase (temporal)
// import "./utils/test-supabase";

// Test de productos CORREGIDO (sin brand) - FUNCIONANDO
// import "./services/products-fixed";

// Optimizaciones de performance - diferidas para no bloquear el render
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(() => {
    import("@/utils/performance-optimizer").then(({ initializePerformanceOptimizations }) => {
      initializePerformanceOptimizations();
    });
  });
} else {
  setTimeout(() => {
    import("@/utils/performance-optimizer").then(({ initializePerformanceOptimizations }) => {
      initializePerformanceOptimizations();
    });
  }, 0);
}

// Monitoreo de Web Vitals - solo en desarrollo
if (import.meta.env.DEV) {
  import("@/utils/performance-optimizer").then(({ enhancedWebVitalsMonitoring }) => {
    enhancedWebVitalsMonitoring();
  });
}

createRoot(document.getElementById("root")!).render(
  <ConfirmProvider>
    <App />
  </ConfirmProvider>
);
