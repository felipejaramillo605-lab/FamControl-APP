import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2 } from 'lucide-react';

const AppEvents = ({
  events,
  setEvents,
  darkMode,
  card,
  border,
  text,
  textSec,
  input
}) => {
  const [eventForm, setEventForm] = useState({
    categoria: 'Cita',
    titulo: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    ubicacion: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);

  const addEvent = async () => {
    if (!eventForm.titulo) {
      alert('Por favor ingresa un título para el evento');
      return;
    }
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      const newId = editingEventId || `event_${Date.now()}`;
      const newEvent = { 
        id: newId, 
        titulo: eventForm.titulo,
        categoria: eventForm.categoria,
        fecha_inicio: eventForm.fecha_inicio,
        ubicacion: eventForm.ubicacion,
        user_id: currentUser.id,
        created_at: new Date().toISOString() 
      };
      
      console.log('🔄 Guardando evento:', newEvent);
      
      const { error } = await supabase
        .from('events')
        .upsert(newEvent);
      
      if (error) throw error;
      
      setEvents(prev => ({ ...prev, [newId]: newEvent }));
      setEventForm({ 
        categoria: 'Cita', 
        titulo: '', 
        fecha_inicio: new Date().toISOString().split('T')[0],
        ubicacion: '' 
      });
      setEditingEventId(null);
      
      console.log('✅ Evento guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando evento:', error);
      alert('Error al guardar el evento: ' + error.message);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await supabase.from('events').delete().eq('id', id);
      const newEvents = {...events}; 
      delete newEvents[id]; 
      setEvents(newEvents); 
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar el evento');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
      {/* Formulario para crear evento */}
      <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
        <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nuevo Evento</h2>
        
        <select 
          value={eventForm.categoria} 
          onChange={(e) => setEventForm({ ...eventForm, categoria: e.target.value })} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: `1px solid ${border}`, 
            borderRadius: '0.5rem', 
            backgroundColor: input, 
            color: text, 
            marginBottom: '1rem', 
            boxSizing: 'border-box' 
          }}
        >
          <option value="Cita">📌 Cita</option>
          <option value="Reunión">👥 Reunión</option>
          <option value="Cumpleaños">🎂 Cumpleaños</option>
          <option value="Evento">🎉 Evento</option>
          <option value="Recordatorio">⏰ Recordatorio</option>
        </select>

        <input 
          type="text" 
          placeholder="Título del evento" 
          value={eventForm.titulo} 
          onChange={(e) => setEventForm({ ...eventForm, titulo: e.target.value })} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: `1px solid ${border}`, 
            borderRadius: '0.5rem', 
            backgroundColor: input, 
            color: text, 
            marginBottom: '1rem', 
            boxSizing: 'border-box' 
          }} 
        />

        <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Fecha del evento
        </label>
        <input 
          type="date" 
          value={eventForm.fecha_inicio} 
          onChange={(e) => setEventForm({ ...eventForm, fecha_inicio: e.target.value })} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: `1px solid ${border}`, 
            borderRadius: '0.5rem', 
            backgroundColor: input, 
            color: text, 
            marginBottom: '1rem', 
            boxSizing: 'border-box' 
          }} 
        />

        <input 
          type="text" 
          placeholder="Ubicación (opcional)" 
          value={eventForm.ubicacion} 
          onChange={(e) => setEventForm({ ...eventForm, ubicacion: e.target.value })} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: `1px solid ${border}`, 
            borderRadius: '0.5rem', 
            backgroundColor: input, 
            color: text, 
            marginBottom: '1rem', 
            boxSizing: 'border-box' 
          }} 
        />

        <button 
          onClick={addEvent} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: '#7c3aed', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            fontWeight: '600', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem' 
          }}
        >
          <Plus size={18} /> Agregar Evento
        </button>
      </div>

      {/* Lista de eventos */}
      <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Mis Eventos</h2>
        
        {Object.values(events).length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.values(events).map(e => {
              const eventDate = new Date(e.fecha_inicio);
              const today = new Date();
              const isUpcoming = eventDate >= today;
              
              return (
                <div 
                  key={e.id} 
                  style={{ 
                    backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
                    border: `2px solid ${isUpcoming ? '#3b82f6' : '#6b7280'}`,
                    borderRadius: '0.75rem', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {e.categoria === 'Cita' && '📌'}
                        {e.categoria === 'Reunión' && '👥'}
                        {e.categoria === 'Cumpleaños' && '🎂'}
                        {e.categoria === 'Evento' && '🎉'}
                        {e.categoria === 'Recordatorio' && '⏰'}
                      </span>
                      <h3 style={{ color: text, margin: 0, fontWeight: '600' }}>{e.titulo}</h3>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: isUpcoming ? '#3b82f6' : '#6b7280',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem'
                      }}>
                        {isUpcoming ? 'Próximo' : 'Pasado'}
                      </span>
                    </div>
                    
                    <p style={{ color: textSec, margin: '0.5rem 0', fontSize: '0.875rem' }}>
                      📅 {eventDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    
                    {e.ubicacion && (
                      <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>
                        📍 {e.ubicacion}
                      </p>
                    )}
                    
                    <p style={{ color: textSec, margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>
                      {e.categoria}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => deleteEvent(e.id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: textSec }}>
            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📅</p>
            <h3 style={{ color: textSec, margin: '0 0 0.5rem 0' }}>No hay eventos</h3>
            <p style={{ margin: 0 }}>Crea tu primer evento para no olvidar nada importante</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppEvents;