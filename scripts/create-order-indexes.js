#!/usr/bin/env node

/**
 * Script para crear índices de optimización de pedidos
 * Ejecutar con: node scripts/create-order-indexes.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno desde .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

let supabaseUrl, supabaseKey;

try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    for (const line of envLines) {
        const [key, value] = line.split('=');
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value;
    }
} catch (error) {
    console.error('❌ Error leyendo .env:', error.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no encontradas en .env');
    console.error('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const indexes = [
    {
        name: 'idx_orders_user_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);',
        description: 'Optimización para consultas por usuario y estado'
    },
    {
        name: 'idx_orders_status_created',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);',
        description: 'Optimización para filtrado por estado y orden cronológico'
    },
    {
        name: 'idx_orders_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);',
        description: 'Optimización para ordenamiento por fecha'
    },
    {
        name: 'idx_orders_order_number',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);',
        description: 'Optimización para búsqueda por número de orden'
    },
    {
        name: 'idx_order_items_order_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);',
        description: 'Optimización para JOIN entre orders y order_items'
    },
    {
        name: 'idx_order_items_product_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);',
        description: 'Optimización para consultas de productos en pedidos'
    },
    {
        name: 'idx_orders_user_created',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);',
        description: 'Optimización para historial de pedidos por usuario'
    }
];

async function createIndexes() {
    console.log('🚀 Creando índices de optimización para pedidos...\n');

    for (const index of indexes) {
        try {
            console.log(`📝 Creando índice: ${index.name}`);
            console.log(`   ${index.description}`);

            const { error } = await supabase.rpc('exec_sql', {
                sql: index.sql
            });

            if (error) {
                console.error(`❌ Error creando ${index.name}:`, error.message);
            } else {
                console.log(`✅ Índice ${index.name} creado exitosamente\n`);
            }
        } catch (error) {
            console.error(`❌ Error inesperado creando ${index.name}:`, error.message);
        }
    }

    console.log('🎉 Proceso completado!');
    console.log('\n💡 Verificación: Ejecuta el siguiente SQL en Supabase para verificar:');
    console.log(`
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, indexname;
  `);
}

createIndexes().catch(console.error);