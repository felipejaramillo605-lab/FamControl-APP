import { supabase } from '../supabaseClient';
import { sendEmailNotification } from './emailService';

export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('*, events(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .gte('scheduled_for', fiveMinutesAgo.toISOString());

    if (error) {
      console.error('Error obteniendo recordatorios:', error);
      return;
    }

    console.log(`📊 Recordatorios pendientes: ${reminders?.length || 0}`);

    for (const reminder of reminders || []) {
      await processReminder(reminder);
    }
  } catch (error) {
    console.error('❌ Error en checkAndSendReminders:', error);
  }
};

const processReminder = async (reminder) => {
  try {
    const { id, notification_type, email } = reminder;

    if (notification_type === 'email' && email) {
      const result = await sendEmailNotification(email, {
        titulo: reminder.events?.titulo || 'Evento',
        fecha_inicio: reminder.events?.fecha_inicio,
        reminder_time: reminder.events?.reminder_time,
        ubicacion: reminder.events?.ubicacion,
        observaciones: reminder.events?.observaciones
      });

      if (result.success) {
        await supabase
          .from('event_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', id);

        console.log('✅ Recordatorio marcado como enviado:', id);
      } else {
        await supabase
          .from('event_reminders')
          .update({
            status: 'failed',
            error_message: result.error
          })
          .eq('id', id);

        console.error('❌ Error enviando recordatorio:', result.error);
      }
    }
  } catch (error) {
    console.error('Error procesando recordatorio:', error);
  }
};

export const startReminderWorker = () => {
  console.log('🔄 Iniciando servicio de recordatorios...');
  
  setInterval(() => {
    checkAndSendReminders();
  }, 60000);
  
  checkAndSendReminders();
};

export default {
  checkAndSendReminders,
  startReminderWorker
};