import React from "react";

export const StatsCard: React.FC<{
  title: string;
  value: number;
  variant?: "default" | "warning" | "info" | "success" | "destructive";
  isActive?: boolean;
  onClick?: () => void;
}> = ({
  title,
  value,
  variant = "default",
  isActive = false,
  onClick,
}) => {
  const variantStyles: Record<string, string> = {
    default: "bg-gray-50 border-gray-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    destructive: "bg-red-50 border-red-200",
  };

  return (
    <div
      className={`border rounded-lg p-4 ${variantStyles[variant]} ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      } ${isActive ? "ring-2 ring-primary ring-offset-1" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default StatsCard;
