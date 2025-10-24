import React, { useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';

const DailyQuote = () => {
  const settingsStore = useSettingsStore();
  const { currentQuote } = settingsStore;

  useEffect(() => {
    if (!currentQuote) {
      settingsStore.loadRandomQuote();
    }
  }, [currentQuote, settingsStore]);

  const loadNewQuote = () => {
    settingsStore.loadRandomQuote();
  };

  if (!currentQuote) return null;

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Frase del Día</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ 
          color: 'white', 
          fontStyle: 'italic', 
          fontSize: '1.1rem',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.5'
        }}>
          "{currentQuote.quote}"
        </p>
        <p style={{ 
          color: '#999', 
          textAlign: 'right',
          margin: 0,
          fontSize: '0.875rem'
        }}>
          — {currentQuote.author}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={loadNewQuote}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🔄 Nueva Frase
        </button>
      </div>
    </div>
  );
};

export default DailyQuote;