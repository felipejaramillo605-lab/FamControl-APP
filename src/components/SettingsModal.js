import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';

const SettingsModal = ({ isOpen, onClose }) => {
  const settingsStore = useSettingsStore();
  const { settings, updateSettings, changePassword } = settingsStore;
  
  const [formData, setFormData] = useState({
    app_name: 'FamControl v2',
    currency: 'COP',
    use_thousands_separator: true,
    primary_color: '#2563eb',
    secondary_color: '#10b981'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Actualizar formData cuando las settings cambien
  useEffect(() => {
    if (isOpen && settings) {
      setFormData({
        app_name: settings.app_name || 'FamControl v2',
        currency: settings.currency || 'COP',
        use_thousands_separator: settings.use_thousands_separator ?? true,
        primary_color: settings.primary_color || '#2563eb',
        secondary_color: settings.secondary_color || '#10b981'
      });
    }
  }, [isOpen, settings]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validar que el nombre no esté vacío
      if (!formData.app_name.trim()) {
        showMessage('error', 'El nombre de la aplicación no puede estar vacío');
        return;
      }

      const success = await updateSettings(formData);
      
      if (success) {
        showMessage('success', 'Configuración guardada correctamente');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        showMessage('error', 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      // Validaciones
      if (!passwordData.currentPassword) {
        showMessage('error', 'Ingresa tu contraseña actual');
        return;
      }

      if (!passwordData.newPassword) {
        showMessage('error', 'Ingresa una nueva contraseña');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showMessage('error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showMessage('error', 'Las contraseñas no coinciden');
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        showMessage('error', 'La nueva contraseña debe ser diferente a la actual');
        return;
      }

      setLoading(true);
      
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        showMessage('success', 'Contraseña cambiada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', result.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '1rem',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Configuración</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Mensaje de estado */}
        {message.text && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: message.type === 'success' ? '#1a3a1a' : '#3a1a1a',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.875rem'
          }}>
            {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
          </div>
        )}

        {/* Personalización */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem' }}>Personalización</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Nombre de la aplicación
            </label>
            <input
              type="text"
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                backgroundColor: '#2a2a2a',
                color: 'white',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Moneda
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                backgroundColor: '#2a2a2a',
                color: 'white',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            >
              <option value="COP">COP - Peso Colombiano</option>
              <option value="USD">USD - Dólar Americano</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#ccc', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.use_thousands_separator}
                onChange={(e) => setFormData({ ...formData, use_thousands_separator: e.target.checked })}
                disabled={loading}
                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Usar separador de miles</span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Color primario
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                disabled={loading}
                style={{
                  width: '50px',
                  height: '40px',
                  padding: '0.25rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              />
              <span style={{ color: '#999', fontSize: '0.875rem' }}>{formData.primary_color}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Color secundario
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                disabled={loading}
                style={{
                  width: '50px',
                  height: '40px',
                  padding: '0.25rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              />
              <span style={{ color: '#999', fontSize: '0.875rem' }}>{formData.secondary_color}</span>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px solid #333', margin: '1.5rem 0' }}></div>

        {/* Cambiar Contraseña */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem' }}>Cambiar Contraseña</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Contraseña actual"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                backgroundColor: '#2a2a2a',
                color: 'white',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                backgroundColor: '#2a2a2a',
                color: 'white',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                backgroundColor: '#2a2a2a',
                color: 'white',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: loading ? '#555' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Procesando...' : 'Cambiar Contraseña'}
          </button>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: loading ? '#666' : 'white',
              border: `1px solid ${loading ? '#555' : '#333'}`,
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#0d7944' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;