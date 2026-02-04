// src/utils/performance-optimizer.ts - Optimizaciones de performance
import { memo } from "react";

// Pre-conectar a dominios críticos
export function preconnectCriticalDomains() {
  const domains = [
    "https://txjryksczwwthbgmmjms.supabase.co",
    "https://images.unsplash.com",
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ];

  domains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Preload imagen hero crítica (DESHABILITADO - ahora se usa imagen desde DB)
export function preloadHeroImage() {
  // Ya no es necesario porque el hero carga dinámicamente desde la base de datos
  // const heroImageUrl = "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  // const link = document.createElement("link");
  // link.rel = "preload";
  // link.as = "image";
  // link.href = heroImageUrl;
  // link.setAttribute("fetchpriority", "high");
  // document.head.appendChild(link);
}

// HOC para memoización optimizada
export function withPerformanceOptimization<T extends object>(Component: React.ComponentType<T>) {
  const MemoizedComponent = memo(Component);
  MemoizedComponent.displayName = `withPerformanceOptimization(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

// Optimizar carga de fuentes
export function optimizeFontLoading() {
  // Preload de fuente crítica
  const fontLink = document.createElement("link");
  fontLink.rel = "preload";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  fontLink.as = "style";
  fontLink.onload = function () {
    (this as HTMLLinkElement).onload = null;
    (this as HTMLLinkElement).rel = "stylesheet";
  };
  document.head.appendChild(fontLink);
}

// Reducir Layout Shift
export function reduceLayoutShift() {
  // Agregar CSS crítico para reservar espacio
  const style = document.createElement("style");
  style.textContent = `
    /* Reservar espacio para hero */
    .hero-container {
      min-height: 500px;
    }
    
    @media (min-width: 768px) {
      .hero-container {
        min-height: 600px;
      }
    }
    
    @media (min-width: 1024px) {
      .hero-container {
        min-height: 650px;
      }
    }
    
    /* Reservar espacio para imágenes de productos */
    .product-image-container {
      aspect-ratio: 16/9;
      background-color: #f3f4f6;
    }
    
    /* Skeleton optimizado */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.4s ease infinite;
    }
    
    @keyframes skeleton-loading {
      0% { background-position: 100% 50%; }
      100% { background-position: -100% 50%; }
    }
  `;
  document.head.appendChild(style);
}

// Optimizar interacciones
export function optimizeInteractions() {
  // Preload páginas críticas al hacer hover
  const prefetchPages = ["/login", "/cart", "/citas"];

  prefetchPages.forEach((page) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = page;
    document.head.appendChild(link);
  });
}

// Inicializar todas las optimizaciones
export function initializePerformanceOptimizations() {
  // Ejecutar inmediatamente
  preconnectCriticalDomains();
  preloadHeroImage();
  reduceLayoutShift();

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      optimizeFontLoading();
      optimizeInteractions();
    });
  } else {
    optimizeFontLoading();
    optimizeInteractions();
  }
}

// Monitoreo de Web Vitals mejorado
export function enhancedWebVitalsMonitoring() {
  if (typeof window === "undefined") return;

  // Monitorear LCP
  if ("PerformanceObserver" in window) {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      console.log(`🎯 LCP: ${Math.round(lastEntry.startTime)}ms`);

      // Si LCP > 2500ms, mostrar advertencia
      if (lastEntry.startTime > 2500) {
        console.warn("⚠️ LCP es muy alto. Considera optimizar la imagen hero o reducir el JavaScript crítico.");
      }

      lcpObserver.disconnect();
    });

    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
  }
}

// Hook para usar en componentes
export function usePerformanceOptimization() {
  return {
    preconnectCriticalDomains,
    preloadHeroImage,
    reduceLayoutShift,
    optimizeInteractions,
  };
}
