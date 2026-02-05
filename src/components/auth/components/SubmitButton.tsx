// src/components/auth/components/SubmitButton.tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  loading: boolean;
  loadingText: string;
  text: string;
  className?: string;
}

export default function SubmitButton({
  loading,
  loadingText,
  text,
  className = "w-full",
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={loading} className={className}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText : text}
    </Button>
  );
}
