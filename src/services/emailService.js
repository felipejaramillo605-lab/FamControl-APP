import { supabase } from '../supabaseClient';

/**
 * Validar si un email es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Enviar notificación por email usando Google Apps Script
 */
export const sendEmailNotification = async (recipientEmail, eventData) => {
  try {
    // Validar email del destinatario
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      console.warn('⚠️ Email inválido:', recipientEmail);
      return { success: false, error: 'Email inválido' };
    }

    // Obtener URL del Google Apps Script desde variables de entorno
    const googleScriptUrl = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
    
    if (!googleScriptUrl) {
      console.error('❌ URL del Google Apps Script no configurada');
      console.error('Por favor, configura REACT_APP_GOOGLE_APPS_SCRIPT_URL en .env.local');
      return { success: false, error: 'Servicio de email no configurado' };
    }

    // Validar datos del evento
    if (!eventData || !eventData.titulo) {
      console.warn('⚠️ Datos del evento incompletos');
      return { success: false, error: 'Datos del evento incompletos' };
    }

    // Construir payload para el Google Apps Script
    const payload = {
      action: 'sendEmail',
      recipient: recipientEmail.trim(),
      subject: `🔔 Recordatorio: ${eventData.titulo}`,
      emailBody: {
        eventTitle: eventData.titulo || 'Evento sin título',
        eventDate: eventData.fecha_inicio || 'Fecha no especificada',
        eventTime: eventData.hora_inicio || 'Hora no especificada',
        eventLocation: eventData.ubicacion || 'Ubicación no especificada',
        eventNotes: eventData.observaciones || 'Sin notas'
      }
    };

    console.log('📧 Enviando email a:', recipientEmail);
    console.log('📋 Datos del evento:', payload);

    // Enviar solicitud al Google Apps Script
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Important para CORS
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Solicitud de email enviada correctamente');
    
    return { 
      success: true, 
      recipient: recipientEmail,
      message: 'Email enviado correctamente'
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido al enviar email'
    };
  }
};

/**
 * Guardar preferencias de notificación del usuario
 */
export const saveNotificationPreferences = async (userId, email) => {
  try {
    if (!userId || !email) {
      throw new Error('UserID y email requeridos');
    }

    if (!isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    // Preparar datos para guardar - NO como JSON, sino como campos específicos
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        notification_email: email.trim(), // Campo específico para el email
        notification_preferences: JSON.stringify({
          email: email.trim(),
          enabled: true,
          updated_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Error guardando preferencias:', error);
      throw error;
    }

    console.log('✅ Preferencias de notificación guardadas');
    return { success: true };

  } catch (error) {
    console.error('❌ Error en saveNotificationPreferences:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendEmailNotification,
  isValidEmail,
  saveNotificationPreferences
};