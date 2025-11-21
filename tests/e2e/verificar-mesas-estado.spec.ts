import { test, expect } from '@playwright/test';
import { supabase } from '../services/supabaseClient';

test('verificar estado de todas las mesas', async () => {
  console.log('🔍 Verificando estado de todas las mesas...');
  
  try {
    // Obtener todas las mesas con su estado
    const { data: mesas, error } = await supabase
      .from('mesas')
      .select('id, nombre, estado, qr_code')
      .order('nombre');
    
    if (error) {
      console.log('❌ Error al obtener mesas:', error);
      return;
    }
    
    console.log('📊 Estado actual de las mesas:');
    mesas?.forEach((mesa) => {
      console.log(`  ${mesa.nombre}: ${mesa.estado} (ID: ${mesa.id})`);
    });
    
    // Verificar si hay visitas activas
    const { data: visitasActivas } = await supabase
      .from('visitas')
      .select('id, mesa_id, hora_llegada')
      .is('hora_salida', null);
    
    console.log('\n👥 Visitas activas:');
    visitasActivas?.forEach((visita) => {
      const mesa = mesas?.find(m => m.id === visita.mesa_id);
      console.log(`  ${mesa?.nombre}: ${visita.hora_llegada}`);
    });
    
    // Verificar reservas confirmadas
    const { data: reservasConfirmadas } = await supabase
      .from('reservas')
      .select('id, mesa_id, fecha_hora, estado')
      .eq('estado', 'Confirmada');
    
    console.log('\n📅 Reservas confirmadas:');
    reservasConfirmadas?.forEach((reserva) => {
      const mesa = mesas?.find(m => m.id === reserva.mesa_id);
      console.log(`  ${mesa?.nombre}: ${reserva.fecha_hora} (${reserva.estado})`);
    });
    
    console.log('\n✅ Análisis completado');
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
});