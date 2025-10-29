import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Shield, Key, RefreshCw, Check, X, Mail, Lock } from 'lucide-react';

const AdminDashboard = ({ onClose, darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
    userEmail: null
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Error al cargar usuarios: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailVerification = async (userId, currentValue) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          email_verification_required: !currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Configuración de verificación actualizada' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar: ' + error.message });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordData.userEmail) {
      setMessage({ type: 'error', text: 'Email de usuario no disponible' });
      return;
    }

    try {
      // Enviar email de restablecimiento de contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetPasswordData.userEmail,
        {
          redirectTo: `${window.location.origin}`,
        }
      );
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: `✅ Email de recuperación enviado a ${resetPasswordData.userEmail}. El usuario recibirá un enlace para cambiar su contraseña.` 
      });
      setResetPasswordData({ userId: null, userEmail: null });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: '❌ Error: ' + error.message });
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: `Rol de usuario actualizado a ${newRole}` });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar rol: ' + error.message });
    }
  };

  const bg = darkMode ? '#1a1a1a' : '#ffffff';
  const card = darkMode ? '#2a2a2a' : '#f9f9f9';
  const text = darkMode ? '#ffffff' : '#000000';
  const textSec = darkMode ? '#999999' : '#666666';
  const border = darkMode ? '#333' : '#e5e5e5';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: bg,
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: `1px solid ${border}`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: `1px solid ${border}`,
          paddingBottom: '1rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: text,
            fontSize: '1.5rem'
          }}>
            <Shield size={28} /> Panel de Administración
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
              color: text,
              borderRadius: '0.5rem',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar"
          >
            ×
          </button>
        </div>

        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: text,
            fontSize: '1.1rem'
          }}>
            <RefreshCw size={32} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <div>Cargando usuarios...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: darkMode ? '#2a2a2a' : '#f3f4f6',
                  borderBottom: `2px solid ${border}`
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: text, fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: text, fontWeight: '600' }}>Rol</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: text, fontWeight: '600' }}>Verificación Email</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: text, fontWeight: '600' }}>Fecha Registro</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: text, fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ 
                    borderBottom: `1px solid ${border}`,
                    backgroundColor: user.role === 'admin' ? (darkMode ? '#1a2a1a' : '#f0fdf4') : 'transparent'
                  }}>
                    <td style={{ 
                      padding: '1rem', 
                      color: text,
                      fontWeight: user.role === 'admin' ? '600' : '400'
                    }}>
                      {user.email}
                      {user.role === 'admin' && ' 👑'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          border: `1px solid ${border}`,
                          backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                          color: text,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleEmailVerification(user.id, user.email_verification_required)}
                        disabled={user.role === 'admin'}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                          backgroundColor: user.email_verification_required ? '#fef3c7' : '#d1fae5',
                          color: user.email_verification_required ? '#92400e' : '#065f46',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          opacity: user.role === 'admin' ? 0.6 : 1
                        }}
                        title={user.role === 'admin' ? 'Los administradores no requieren verificación' : 'Activar/desactivar verificación de email'}
                      >
                        {user.email_verification_required ? '✅ Requerida' : '❌ No Requerida'}
                      </button>
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: textSec,
                      fontSize: '0.8rem'
                    }}>
                      {new Date(user.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {resetPasswordData.userId === user.id ? (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            alignItems: 'center',
                            backgroundColor: card,
                            padding: '0.5rem',
                            borderRadius: '0.5rem'
                          }}>
                            <span style={{ fontSize: '0.875rem', color: text }}>
                              ¿Enviar email de recuperación a <strong>{resetPasswordData.userEmail}</strong>?
                            </span>
                            <button
                              onClick={handleResetPassword}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              Sí, enviar
                            </button>
                            <button
                              onClick={() => setResetPasswordData({ userId: null, userEmail: null })}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetPasswordData({ 
                              userId: user.id, 
                              userEmail: user.email
                            })}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                            title="Enviar email de recuperación de contraseña"
                          >
                            <Key size={14} /> Enviar email de recuperación
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${border}`
        }}>
          <div style={{ fontSize: '0.8rem', color: textSec }}>
            Total: {users.length} usuario(s)
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={loadUsers}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={16} /> Actualizar
            </button>
            
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;