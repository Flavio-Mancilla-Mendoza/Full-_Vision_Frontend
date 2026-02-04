import { useEffect, useState } from "react";

interface WebVitalsMetrics {
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  INP: number | null; // Interaction to Next Paint (replaces FID)
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
}

interface UseWebVitalsReturn {
  metrics: WebVitalsMetrics;
  isLoading: boolean;
  score: "good" | "needs-improvement" | "poor" | null;
}

// Types for manual measurement fallback
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export const useWebVitals = (): UseWebVitalsReturn => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    FCP: null,
    LCP: null,
    INP: null,
    CLS: null,
    TTFB: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const measureWebVitals = async () => {
      try {
        // Dynamically import web-vitals library if available
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import("web-vitals");

        onCLS((metric) => {
          setMetrics((prev) => ({ ...prev, CLS: metric.value }));
        });

        onINP((metric) => {
          setMetrics((prev) => ({ ...prev, INP: metric.value }));
        });

        onFCP((metric) => {
          setMetrics((prev) => ({ ...prev, FCP: metric.value }));
        });

        onLCP((metric) => {
          setMetrics((prev) => ({ ...prev, LCP: metric.value }));
        });

        onTTFB((metric) => {
          setMetrics((prev) => ({ ...prev, TTFB: metric.value }));
        });
      } catch (error) {
        // Fallback to manual measurement if web-vitals is not available
        measureManually();
      } finally {
        setIsLoading(false);
      }
    };

    const measureManually = () => {
      // Manual FCP measurement
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
      if (fcpEntry) {
        setMetrics((prev) => ({ ...prev, FCP: fcpEntry.startTime }));
      }

      // Manual LCP measurement using PerformanceObserver
      if ("PerformanceObserver" in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;
          setMetrics((prev) => ({ ...prev, LCP: lastEntry.startTime }));
        });

        try {
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
          // LCP not supported
        }

        // Manual CLS measurement
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as LayoutShift).hadRecentInput) {
              clsValue += (entry as LayoutShift).value;
            }
          }
          setMetrics((prev) => ({ ...prev, CLS: clsValue }));
        });

        try {
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          // CLS not supported
        }
      }

      // Manual TTFB measurement
      const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        setMetrics((prev) => ({ ...prev, TTFB: ttfb }));
      }
    };

    measureWebVitals();
  }, []);

  // Calculate overall score based on Core Web Vitals thresholds
  const score = (): "good" | "needs-improvement" | "poor" | null => {
    const { LCP, INP, CLS } = metrics;

    if (LCP === null || INP === null || CLS === null) {
      return null;
    }

    const lcpScore = LCP <= 2500 ? "good" : LCP <= 4000 ? "needs-improvement" : "poor";
    const inpScore = INP <= 200 ? "good" : INP <= 500 ? "needs-improvement" : "poor";
    const clsScore = CLS <= 0.1 ? "good" : CLS <= 0.25 ? "needs-improvement" : "poor";

    // Return worst score
    if (lcpScore === "poor" || inpScore === "poor" || clsScore === "poor") {
      return "poor";
    }
    if (lcpScore === "needs-improvement" || inpScore === "needs-improvement" || clsScore === "needs-improvement") {
      return "needs-improvement";
    }
    return "good";
  };

  return {
    metrics,
    isLoading,
    score: score(),
  };
};
