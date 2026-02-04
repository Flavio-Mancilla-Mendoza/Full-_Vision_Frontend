import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas esta clave

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.log('Necesitas configurar:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    try {
        console.log('🚀 Iniciando configuración de base de datos...');

        // Leer el archivo SQL
        const sqlPath = path.join(process.cwd(), 'database', 'full_vision_schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando schema de base de datos...');

        // Ejecutar el SQL
        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ Error ejecutando schema:', error);
            return;
        }

        console.log('✅ Base de datos configurada exitosamente!');
        console.log('🎉 Tu aplicación Full Vision está lista para usar!');

        // Crear usuario admin de ejemplo
        console.log('👤 Para crear tu usuario administrador, ejecuta en Supabase SQL Editor:');
        console.log(`
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  auth.uid(), 
  'tu_email@ejemplo.com', 
  'Tu Nombre', 
  'admin'
);
    `);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupDatabase();