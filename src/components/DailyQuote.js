import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings';

const DailyQuote = () => {
  const settingsStore = useSettingsStore();
  const { currentQuote, loadRandomQuote } = settingsStore;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Solo cargar frase al montar el componente (en el navegador)
  useEffect(() => {
    // Validar que estamos en el navegador
    if (typeof window === 'undefined') return;

    // Si no hay frase y no hemos intentado cargar, cargar una
    if (!currentQuote && !hasLoaded) {
      setLoading(true);
      loadRandomQuote()
        .then(() => {
          setHasLoaded(true);
          setError(null);
        })
        .catch((err) => {
          console.error('Error loading quote:', err);
          setError('No se pudo cargar la frase');
          setHasLoaded(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []); // Solo se ejecuta al montar

  const handleLoadNewQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadRandomQuote();
    } catch (err) {
      console.error('Error loading new quote:', err);
      setError('No se pudo cargar la nueva frase');
    } finally {
      setLoading(false);
    }
  };

  // No renderizar nada si no hay frase
  if (!currentQuote) {
    return null;
  }

  // Validar que currentQuote tenga las propiedades necesarias
  const quote = currentQuote.quote || 'Cargando frase...';
  const author = currentQuote.author || 'Anónimo';

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem' }}>
        ✨ Frase del Día
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ 
          color: 'white', 
          fontStyle: 'italic', 
          fontSize: '1.1rem',
          margin: '0 0 0.75rem 0',
          lineHeight: '1.6',
          textAlign: 'center'
        }}>
          "{quote}"
        </p>
        <p style={{ 
          color: '#999', 
          textAlign: 'right',
          margin: 0,
          fontSize: '0.875rem'
        }}>
          — {author}
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: '#3a1a1a',
          color: '#ef4444',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleLoadNewQuote}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: loading ? '#666' : '#2563eb',
            border: `1px solid ${loading ? '#555' : '#2563eb'}`,
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#1a2a3a';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          {loading ? '⏳' : '🔄'} {loading ? 'Cargando...' : 'Nueva Frase'}
        </button>
      </div>
    </div>
  );
};

export default DailyQuote;