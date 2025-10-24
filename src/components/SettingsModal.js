import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';

const SettingsModal = ({ isOpen, onClose }) => {
  const settingsStore = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState({ ...settingsStore.settings });
  const [passwordData, setPasswordData] = useState({ 
    current: '', 
    new: '', 
    confirm: '' 
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const currencyOptions = [
    { label: 'Peso Colombiano (COP)', value: 'COP' },
    { label: 'Dólar Americano (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Peso Mexicano (MXN)', value: 'MXN' }
  ];

  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settingsStore.settings });
      setPasswordData({ current: '', new: '', confirm: '' });
    }
  }, [isOpen, settingsStore.settings]);

  const handleSaveSettings = async () => {
    const success = await settingsStore.saveSettings(localSettings);
    if (success) {
      alert('Configuración guardada correctamente');
      onClose();
    } else {
      alert('Error al guardar la configuración');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setChangingPassword(true);
    const result = await settingsStore.changePassword(
      passwordData.current,
      passwordData.new
    );
    
    setChangingPassword(false);

    if (result.success) {
      alert('Contraseña cambiada correctamente');
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
      alert(result.error || 'Error al cambiar contraseña');
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
        borderRadius: '1rem',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Configuración</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '1.5rem', 
              cursor: 'pointer' 
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #333' }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === 'general' ? '#2563eb' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '0.5rem 0.5rem 0 0'
            }}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === 'security' ? '#2563eb' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '0.5rem 0.5rem 0 0'
            }}
          >
            Seguridad
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Nombre de la App
              </label>
              <input
                type="text"
                value={localSettings.app_name}
                onChange={(e) => setLocalSettings({ ...localSettings, app_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  color: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Moneda
              </label>
              <select
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  color: 'white'
                }}
              >
                {currencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={localSettings.thousands_separator}
                  onChange={(e) => setLocalSettings({ ...localSettings, thousands_separator: e.target.checked })}
                />
                Usar separador de miles
              </label>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Colores de la Interfaz</h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                    Color Primario
                  </label>
                  <input
                    type="color"
                    value={localSettings.color_primary}
                    onChange={(e) => setLocalSettings({ ...localSettings, color_primary: e.target.value })}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                    Color Secundario
                  </label>
                  <input
                    type="color"
                    value={localSettings.color_secondary}
                    onChange={(e) => setLocalSettings({ ...localSettings, color_secondary: e.target.value })}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                    Color de Acento
                  </label>
                  <input
                    type="color"
                    value={localSettings.color_accent}
                    onChange={(e) => setLocalSettings({ ...localSettings, color_accent: e.target.value })}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  color: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  color: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2a2a2a',
                  color: 'white'
                }}
              />
            </div>

            <button 
              onClick={handleChangePassword}
              disabled={changingPassword}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: changingPassword ? '#6b7280' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: changingPassword ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveSettings}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;