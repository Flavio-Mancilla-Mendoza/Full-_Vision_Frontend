import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Inicializar con valores por defecto si no están configurados
// para evitar que la app falle al iniciar
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYzMjgwMDAsImV4cCI6MTk2MTkwNDAwMH0.placeholder";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase no está configurado. Usa API Gateway para todas las operaciones.");
}

export const supabase = createClient(url, key, {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
});
