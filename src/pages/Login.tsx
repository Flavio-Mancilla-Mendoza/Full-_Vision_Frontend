// src/pages/Login.tsx
import AuthCard from "@/components/auth/AuthCard";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full">
        <AuthCard />
      </div>
    </div>
  );
}
