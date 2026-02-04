import { useWebVitals } from "@/hooks/useWebVitals";

// Component to display Web Vitals in development
export const WebVitalsDebugger = () => {
  const { metrics, isLoading, score } = useWebVitals();

  if (import.meta.env.PROD) {
    return null;
  }

  if (isLoading) {
    return <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono z-50">Measuring Web Vitals...</div>;
  }

  const getScoreColor = (score: string | null) => {
    switch (score) {
      case "good":
        return "text-green-400";
      case "needs-improvement":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className={`font-bold mb-2 ${getScoreColor(score)}`}>Web Vitals: {score || "Measuring..."}</div>

      <div className="space-y-1">
        <div>FCP: {metrics.FCP ? `${metrics.FCP.toFixed(0)}ms` : "N/A"}</div>
        <div>LCP: {metrics.LCP ? `${metrics.LCP.toFixed(0)}ms` : "N/A"}</div>
        <div>INP: {metrics.INP ? `${metrics.INP.toFixed(0)}ms` : "N/A"}</div>
        <div>CLS: {metrics.CLS ? metrics.CLS.toFixed(3) : "N/A"}</div>
        <div>TTFB: {metrics.TTFB ? `${metrics.TTFB.toFixed(0)}ms` : "N/A"}</div>
      </div>
    </div>
  );
};

export default WebVitalsDebugger;
