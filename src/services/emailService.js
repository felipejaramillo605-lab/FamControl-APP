export const sendEmailNotification = async (recipientEmail, eventData) => {
  try {
    if (!recipientEmail) {
      console.warn('⚠️ Email no configurado');
      return { success: false, error: 'Email no configurado' };
    }

    const googleScriptUrl = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
    
    if (!googleScriptUrl) {
      console.error('❌ URL del script no configurada');
      return { success: false, error: 'Servicio no configurado' };
    }

    const payload = {
      action: 'sendEmail',
      recipient: recipientEmail,
      subject: `🔔 Recordatorio: ${eventData.titulo}`,
      eventTitle: eventData.titulo,
      eventDate: eventData.fecha_inicio,
      eventTime: eventData.hora_inicio,
      eventLocation: eventData.ubicacion,
      eventNotes: eventData.observaciones
    };

    console.log('📧 Enviando email a:', recipientEmail);

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Email enviado');
    return { success: true, recipient: recipientEmail };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default {
  sendEmailNotification,
  isValidEmail
};