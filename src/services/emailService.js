import { supabase } from '../supabaseClient';

/**
 * Validar si un email es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Enviar notificación por email usando Google Apps Script - CORREGIDO
 */
export const sendEmailNotification = async (recipientEmail, eventData) => {
  try {
    console.log('🚀 INICIANDO sendEmailNotification');
    console.log('📧 Destinatario:', recipientEmail);
    console.log('📋 Event Data:', eventData);

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

    console.log('🔗 URL del script:', googleScriptUrl);

    // Validar datos del evento
    if (!eventData || !eventData.titulo) {
      console.warn('⚠️ Datos del evento incompletos');
      return { success: false, error: 'Datos del evento incompletos' };
    }

    // Construir payload para el Google Apps Script - CORREGIDO
    const payload = {
      action: 'sendEmail',
      recipient: recipientEmail.trim(),
      subject: `🔔 Recordatorio: ${eventData.titulo}`,
      emailBody: {
        eventTitle: eventData.titulo || 'Evento sin título',
        eventDate: eventData.fecha_inicio || 'Fecha no especificada',
        eventTime: eventData.reminder_time || eventData.hora_inicio || 'Hora no especificada', // ← CORREGIDO
        eventLocation: eventData.ubicacion || 'Ubicación no especificada',
        eventNotes: eventData.observaciones || 'Sin notas'
      }
    };

    console.log('📤 Payload a enviar:', payload);

    // ✅ CORRECCIÓN: ELIMINAR mode: 'no-cors' para poder leer la respuesta
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📨 Respuesta recibida, status:', response.status);

    // ✅ CORRECCIÓN: Leer la respuesta del servidor
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP:', response.status, errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Respuesta JSON del servidor:', result);

    if (result.success) {
      console.log('🎉 Email enviado exitosamente');
      return { 
        success: true, 
        recipient: recipientEmail,
        message: result.message || 'Email enviado correctamente'
      };
    } else {
      console.error('❌ Error en respuesta del servidor:', result.message);
      return { 
        success: false, 
        error: result.message || 'Error desconocido del servidor'
      };
    }

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido al enviar email'
    };
  }
};

// El resto del código se mantiene igual...
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