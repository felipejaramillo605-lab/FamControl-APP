import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Verificación en consola para debugging
console.log('Supabase URL:', supabaseUrl ? '✅ Configurada' : '❌ FALTANTE');
console.log('Supabase Key:', supabaseKey ? '✅ Configurada' : '❌ FALTANTE');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno faltantes en Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseKey)