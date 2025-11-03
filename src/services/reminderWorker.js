import { supabase } from '../supabaseClient';
import { sendEmailNotification } from './emailService';

export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    console.log('🔍 Buscando recordatorios entre:', fiveMinutesAgo.toISOString(), 'y', now.toISOString());

    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('*, events(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .gte('scheduled_for', fiveMinutesAgo.toISOString());

    if (error) {
      console.error('❌ Error obteniendo recordatorios:', error);
      return;
    }

    console.log(`📊 Recordatorios pendientes encontrados: ${reminders?.length || 0}`);

    if (reminders && reminders.length > 0) {
      for (const reminder of reminders) {
        console.log('📬 Procesando recordatorio:', reminder.id);
        await processReminder(reminder);
      }
    }
  } catch (error) {
    console.error('❌ Error en checkAndSendReminders:', error);
  }
};

const processReminder = async (reminder) => {
  try {
    console.log('🔍 Detalles del recordatorio:', {
      id: reminder.id,
      notification_type: reminder.notification_type,
      email: reminder.email,
      status: reminder.status,
      event: reminder.events?.titulo
    });

    const { id, notification_type, email } = reminder;

    // Verificar que el tipo sea email y que haya un destinatario
    if (notification_type === 'email' && email) {
      console.log('📧 Enviando email a:', email);

      const result = await sendEmailNotification(email, {
        titulo: reminder.events?.titulo || 'Evento',
        fecha_inicio: reminder.events?.fecha_inicio,
        reminder_time: reminder.events?.reminder_time,
        ubicacion: reminder.events?.ubicacion,
        observaciones: reminder.events?.observaciones
      });

      console.log('📨 Resultado del envío:', result);

      if (result.success) {
        console.log('✅ Email enviado, actualizando estado a "sent"...');

        const { error: updateError } = await supabase
          .from('event_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          console.error('❌ Error actualizando estado:', updateError);
        } else {
          console.log('✅ Recordatorio marcado como enviado:', id);
        }
      } else {
        console.error('❌ Error en sendEmailNotification:', result.error);

        const { error: updateError } = await supabase
          .from('event_reminders')
          .update({
            status: 'failed',
            error_message: result.error
          })
          .eq('id', id);

        if (updateError) {
          console.error('❌ Error actualizando error:', updateError);
        }
      }
    } else {
      console.warn('⚠️ Recordatorio sin email o tipo incorrecto:', {
        notification_type,
        email,
        status: reminder.status
      });
    }
  } catch (error) {
    console.error('❌ Error procesando recordatorio:', error);
  }
};

export const startReminderWorker = () => {
  console.log('🔄 Iniciando servicio de recordatorios...');
  console.log('⏰ Se verificarán recordatorios cada 60 segundos');
  
  // Ejecutar inmediatamente
  checkAndSendReminders();
  
  // Luego cada 60 segundos
  setInterval(() => {
    console.log('🔄 Verificando recordatorios...');
    checkAndSendReminders();
  }, 60000); // 60 segundos
};

export default {
  checkAndSendReminders,
  startReminderWorker
};