import { useEffect } from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  measurePageLoad(): void {
    if (typeof window === "undefined" || !window.performance) return;

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.addMetric("DOM Content Loaded", navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, "ms");
        this.addMetric("Page Load", navigation.loadEventEnd - navigation.loadEventStart, "ms");
        this.addMetric("First Contentful Paint", this.getFirstContentfulPaint(), "ms");
        this.addMetric("Largest Contentful Paint", this.getLargestContentfulPaint(), "ms");
      }
    });
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType("paint");
    const fcpEntry = entries.find((entry) => entry.name === "first-contentful-paint");
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    return new Promise<number>((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ["largest-contentful-paint"] });
      } else {
        resolve(0);
      }
    }) as unknown as number;
  }

  private addMetric(name: string, value: number, unit: string): void {
    this.metrics.push({ name, value, unit });

    // Log performance metrics in development
    if (import.meta.env.DEV) {
      const numValue = typeof value === "number" ? value : 0;
      console.log(`📊 ${name}: ${numValue.toFixed(2)}${unit}`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  logBundleSize(): void {
    if (import.meta.env.DEV) {
      // Estimación más precisa del bundle size
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        let totalSize = 0;

        entries.forEach((entry) => {
          if (entry.name.includes(".js") || entry.name.includes(".css")) {
            // Verificar si es un PerformanceResourceTiming
            if ("transferSize" in entry) {
              totalSize += (entry as PerformanceResourceTiming).transferSize || 0;
            }
          }
        });

        if (totalSize > 0) {
          const sizeInKB = Math.round(totalSize / 1024);
          console.log(`📦 Actual bundle size: ${sizeInKB}KB`);

          // Warning si el bundle es muy grande
          if (sizeInKB > 300) {
            console.warn(`⚠️ Bundle size is large (${sizeInKB}KB). Consider code splitting.`);
          }
        }

        observer.disconnect();
      });

      try {
        observer.observe({ entryTypes: ["resource"] });
      } catch (error) {
        // Fallback para navegadores que no soportan PerformanceObserver
        console.log("📦 Bundle size monitoring not available in this browser");
      }
    }
  }

  measureComponentRender(componentName: string, renderTime: number): void {
    this.addMetric(`${componentName} Render`, renderTime, "ms");
  }
}

interface PerformanceWrapperProps {
  children: React.ReactNode;
  componentName?: string;
}

const PerformanceWrapper = ({ children, componentName = "Component" }: PerformanceWrapperProps) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const monitor = PerformanceMonitor.getInstance();
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        monitor.measureComponentRender(componentName, endTime - startTime);
      };
    }
  }, [componentName]);

  return <>{children}</>;
};

export { PerformanceMonitor, PerformanceWrapper };
export type { PerformanceMetric };
