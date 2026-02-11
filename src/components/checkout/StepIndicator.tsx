// src/components/checkout/StepIndicator.tsx
import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

export function StepIndicator({ step, label, isActive, isCompleted }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step}
      </div>
      <span className={`text-sm ${isActive ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
