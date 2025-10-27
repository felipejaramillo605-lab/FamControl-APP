// components/DailyQuote.js
import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings';

const DailyQuote = () => {
  const settingsStore = useSettingsStore();
  const { currentQuote, loadDailyQuote, loadRandomQuote } = settingsStore;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Solo ejecutar en el cliente después del montaje
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar frase al montar el componente - SOLO UNA VEZ
  useEffect(() => {
    // Solo ejecutar si estamos en el cliente y el componente está montado
    if (!mounted || typeof window === 'undefined') return;

    const loadQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar que las funciones existen antes de llamarlas
        if (typeof loadDailyQuote === 'function') {
          await loadDailyQuote();
        } else {
          // Fallback: cargar frase aleatoria directamente
          if (typeof loadRandomQuote === 'function') {
            await loadRandomQuote();
          } else {
            throw new Error('Funciones de citas no disponibles');
          }
        }
      } catch (err) {
        console.error('Error loading daily quote:', err);
        setError('No se pudo cargar la frase del día');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [mounted, loadDailyQuote, loadRandomQuote]);

  const handleLoadNewQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que la función existe
      if (typeof loadRandomQuote !== 'function') {
        throw new Error('Función loadRandomQuote no disponible');
      }
      
      // Forzar una nueva frase
      await loadRandomQuote();
    } catch (err) {
      console.error('Error loading new quote:', err);
      setError('No se pudo cargar la nueva frase');
    } finally {
      setLoading(false);
    }
  };

  // No renderizar nada durante SSR o si no está montado
  if (!mounted) {
    return null;
  }

  // No renderizar nada si no hay frase, no hay error y no está cargando
  if (!currentQuote && !error && !loading) {
    return null;
  }

  // Usar colores CSS personalizados con fallbacks
  const styles = {
    container: {
      backgroundColor: 'var(--card-bg, #ffffff)',
      border: '1px solid var(--border, #e5e5e5)',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    title: {
      color: 'var(--text, #000000)',
      margin: '0 0 1rem 0',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    quote: {
      color: 'var(--text, #000000)',
      fontStyle: 'italic',
      fontSize: '1.1rem',
      margin: '0 0 0.75rem 0',
      lineHeight: '1.6',
      textAlign: 'center'
    },
    author: {
      color: 'var(--text-sec, #666666)',
      textAlign: 'right',
      margin: 0,
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    error: {
      padding: '0.5rem 0.75rem',
      backgroundColor: 'var(--error-bg, #fef2f2)',
      color: 'var(--error-text, #dc2626)',
      border: '1px solid var(--error-border, #fecaca)',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      marginBottom: '1rem'
    },
    button: (isLoading) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: 'transparent',
      color: isLoading ? 'var(--text-sec, #666666)' : 'var(--primary, #2563eb)',
      border: `1px solid ${isLoading ? 'var(--border, #e5e5e5)' : 'var(--primary, #2563eb)'}`,
      borderRadius: '0.5rem',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      fontWeight: '500',
      fontSize: '0.875rem',
      transition: 'all 0.3s ease',
      opacity: isLoading ? 0.6 : 1,
      ':hover': isLoading ? {} : {
        backgroundColor: 'var(--primary, #2563eb)',
        color: 'white'
      }
    })
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        <span>💭</span> Frase del Día
      </h3>
      
      {/* Estado de carga */}
      {loading && !currentQuote && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: 'var(--text-sec, #666666)'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>⏳</div>
          Cargando frase inspiradora...
        </div>
      )}

      {/* Mostrar frase cuando está disponible */}
      {currentQuote && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={styles.quote}>
            "{currentQuote.quote}"
          </p>
          {currentQuote.author && (
            <p style={styles.author}>
              — {currentQuote.author}
            </p>
          )}
        </div>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Botón para cargar nueva frase - solo mostrar si hay una frase o error */}
      {(currentQuote || error) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleLoadNewQuote}
            disabled={loading}
            style={styles.button(loading)}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'var(--primary, #2563eb)';
                e.target.style.color = 'white';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--primary, #2563eb)';
              }
            }}
          >
            {loading ? '⏳' : '🔄'} 
            {loading ? 'Cargando...' : 'Nueva Frase'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyQuote;