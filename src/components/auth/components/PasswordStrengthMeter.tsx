// src/components/auth/components/PasswordStrengthMeter.tsx
import { useMemo } from "react";
import { getPasswordStrength } from "../schemas/auth-schemas";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

const COLORS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-lime-500",
  5: "bg-green-500",
};

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label, checks } = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  if (!password) return null;

  return (
    <div className="space-y-2" aria-label="Indicador de fortaleza de contraseña">
      {/* Color bar */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              i < score ? COLORS[score] : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <p className={`text-xs font-medium ${score <= 2 ? "text-red-600" : score <= 3 ? "text-yellow-600" : "text-green-600"}`}>
          {label}
        </p>
      )}

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1 text-xs">
            {check.passed ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.passed ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
