import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Health() {
  const [status, setStatus] = useState<string>("Probando conexión a Supabase…");

  useEffect(() => {
    (async () => {
      try {
        // Probar conexión con una tabla real que existe
        const { error } = await supabase.from("products").select("id").limit(1);

        if (error) {
          setStatus("Conectado, pero error: " + error.message);
        } else {
          setStatus("Conexión OK ✅ - Supabase funcionando correctamente");
        }
      } catch (e) {
        setStatus("Error de conexión: " + (e as Error).message);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Health Check</h1>
      <p>{status}</p>
    </div>
  );
}
