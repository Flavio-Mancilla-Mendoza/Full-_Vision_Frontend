import React from "react";

export const StatsCard: React.FC<{ title: string; value: number; variant?: "default" | "warning" | "info" | "success" }> = ({
  title,
  value,
  variant = "default",
}) => {
  const variantStyles: Record<string, string> = {
    default: "bg-gray-50 border-gray-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default StatsCard;
