// src/components/auth/components/PasswordInput.tsx
import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  /** Show strength meter with live checklist */
  showStrength?: boolean;
  /** Current value for the strength meter (use watch() from react-hook-form) */
  strengthValue?: string;
}

/**
 * Password input with show/hide toggle, ARIA support, and optional strength meter.
 * Compatible with react-hook-form register().
 *
 * Usage:
 *   <PasswordInput label="Contraseña" error={errors.password?.message}
 *     showStrength strengthValue={watchedPassword} {...register("password")} />
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      showStrength = false,
      strengthValue = "",
      id,
      placeholder = "Mínimo 8 caracteres",
      ...inputProps
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const errorId = id ? `${id}-error` : undefined;
    const hintId = id ? `${id}-hint` : undefined;

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : showStrength ? hintId : undefined
            }
            aria-required={inputProps.required}
            {...inputProps}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {showStrength && !error && (
          <div id={hintId}>
            <PasswordStrengthMeter password={strengthValue} />
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
