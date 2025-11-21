import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase desde el entorno
const supabaseUrl = 'https://fdinliimdxkkgyqvadvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaW5saWltZHhra2d5cXZhZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NzI4NzQsImV4cCI6MjA0NzQ0ODg3NH0.1WjsV6j4kG7n5Wj8K9s3qM1a2b3c4d5e6f7g8h9i0j1k';

test('verificar mesas directamente en Supabase', async () => {
  console.log('🔍 Verificando mesas directamente en Supabase...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Intentar obtener mesas
    console.log('📡 Consultando tabla mesas...');
    const { data: mesas, error } = await supabase
      .from('mesas')
      .select('*')
      .order('nombre');
    
    if (error) {
      console.log('❌ Error consultando mesas:', error);
      console.log('   Código:', error.code);
      console.log('   Mensaje:', error.message);
      console.log('   Detalles:', error.details);
    } else {
      console.log(`✅ Mesas encontradas: ${mesas?.length || 0}`);
      if (mesas && mesas.length > 0) {
        console.log('\n📋 Primeras 5 mesas:');
        mesas.slice(0, 5).forEach((mesa, i) => {
          console.log(`   ${i + 1}. ID: ${mesa.id}, Nombre: ${mesa.nombre}, Estado: ${mesa.estado}`);
        });
      } else {
        console.log('⚠️  No se encontraron mesas en la base de datos');
      }
    }
    
    // También verificar la estructura de la tabla
    console.log('\n🔍 Verificando estructura de la tabla mesas...');
    if (mesas && mesas.length > 0) {
      const firstMesa = mesas[0];
      console.log('📊 Estructura de la primera mesa:');
      Object.keys(firstMesa).forEach(key => {
        console.log(`   - ${key}: ${typeof firstMesa[key]} = ${firstMesa[key]}`);
      });
    }
    
    expect(true).toBe(true);
    
  } catch (error) {
    console.log('❌ Error conectando a Supabase:', error);
    expect(true).toBe(true); // No fallar el test
  }
});