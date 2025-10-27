// components/SettingsModal.js
import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';
import { X, Save, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    changePassword, 
    resetSettings,
    formatCurrency 
  } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    app_name: '',
    currency: 'COP',
    thousands_separator: true,
    color_primary: '#1976d2',
    color_secondary: '#424242',
    color_accent: '#82B1FF'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar settings actuales cuando el modal se abre
  useEffect(() => {
    if (isOpen && settings && !isInitialized) {
      setFormData({
        app_name: settings.app_name || 'FamControl v2',
        currency: settings.currency || 'COP',
        thousands_separator: settings.thousands_separator !== false,
        color_primary: settings.color_primary || '#1976d2',
        color_secondary: settings.color_secondary || '#424242',
        color_accent: settings.color_accent || '#82B1FF'
      });
      setIsInitialized(true);
    }
    
    // Resetear cuando se cierra el modal
    if (!isOpen) {
      setIsInitialized(false);
      setMessage({ type: '', text: '' });
    }
  }, [isOpen, settings]);

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const success = await updateSettings(formData);
      
      if (success) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('¿Estás seguro de que quieres restaurar la configuración por defecto? Esta acción no se puede deshacer.')) {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      try {
        const success = await resetSettings();
        
        if (success) {
          setMessage({ type: 'success', text: 'Configuración restaurada exitosamente' });
          setTimeout(() => {
            setMessage({ type: '', text: '' });
            setIsInitialized(false); // Forzar recarga de settings
            onClose();
          }, 2000);
        } else {
          setMessage({ type: 'error', text: 'Error al restaurar la configuración' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error inesperado: ' + error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Configuración
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '1rem'
        }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'general' ? '#1976d2' : 'transparent',
              color: activeTab === 'general' ? 'white' : '#666',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'security' ? '#1976d2' : 'transparent',
              color: activeTab === 'security' ? 'white' : '#666',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Seguridad
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'advanced' ? '#1976d2' : 'transparent',
              color: activeTab === 'advanced' ? 'white' : '#666',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Avanzado
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}>
            {message.text}
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nombre de la Aplicación
              </label>
              <input
                type="text"
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Ingresa el nombre de la aplicación"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="COP">Peso Colombiano (COP)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="MXN">Peso Mexicano (MXN)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Colores del Tema
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Color Primario
                  </label>
                  <input
                    type="color"
                    value={formData.color_primary}
                    onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                    style={{
                      width: '100%',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Color Secundario
                  </label>
                  <input
                    type="color"
                    value={formData.color_secondary}
                    onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                    style={{
                      width: '100%',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Color de Acento
                  </label>
                  <input
                    type="color"
                    value={formData.color_accent}
                    onChange={(e) => setFormData({ ...formData, color_accent: e.target.value })}
                    style={{
                      width: '100%',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                id="thousands_separator"
                checked={formData.thousands_separator}
                onChange={(e) => setFormData({ ...formData, thousands_separator: e.target.checked })}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="thousands_separator" style={{ cursor: 'pointer', fontWeight: '600' }}>
                Usar separador de miles en los números
              </label>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '0.5rem',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Vista Previa:</h4>
              <p style={{ margin: 0, color: '#6c757d' }}>
                {formatCurrency(1234567.89)}
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Contraseña Actual
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  onClick={() => togglePasswordVisibility('current')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Confirma tu nueva contraseña"
                />
                <button
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}