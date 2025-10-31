import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Edit2, Check, X, MapPin, Mail, MessageCircle, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

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
    categoria: 'reunion',
    titulo: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    ubicacion: '',
    observaciones: '',
    completado: false,
    recordatorio_habilitado: false,
    recordatorio_fecha: new Date().toISOString().split('T')[0],
    recordatorio_tipo: 'email',
    phone_number: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('todas');
  const [recordatorioMessage, setRecordatorioMessage] = useState('');

  const CATEGORIAS_EVENTOS = {
    reunion: { name: 'Reunión', icon: '👥', color: '#3b82f6' },
    cumpleanos: { name: 'Cumpleaños', icon: '🎂', color: '#ec4899' },
    evento: { name: 'Evento', icon: '🎉', color: '#8b5cf6' },
    recordatorio: { name: 'Recordatorio', icon: '⏰', color: '#f59e0b' },
    tarea: { name: 'Tarea', icon: '✓', color: '#10b981' }
  };

  const addOrUpdateEvent = async () => {
    if (!eventForm.titulo || !eventForm.fecha_inicio) {
      alert('Por favor completa título y fecha');
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
        observaciones: eventForm.observaciones,
        completado: eventForm.completado,
        recordatorio_habilitado: eventForm.recordatorio_habilitado,
        recordatorio_fecha: eventForm.recordatorio_fecha,
        recordatorio_tipo: eventForm.recordatorio_tipo,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('events')
        .upsert(newEvent);

      if (error) throw error;

      setEvents(prev => ({
        ...prev,
        [newId]: newEvent
      }));

      // Mostrar mensaje de confirmación del recordatorio
      if (eventForm.recordatorio_habilitado) {
        setRecordatorioMessage(
          `✅ Recordatorio configurado para ${eventForm.recordatorio_fecha} vía ${eventForm.recordatorio_tipo === 'email' ? '📧 Email' : '💬 WhatsApp'}`
        );
        setTimeout(() => setRecordatorioMessage(''), 3000);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error guardando evento:', error);
      alert('Error al guardar: ' + error.message);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('¿Eliminar este evento?')) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      setEvents(prev => {
        const newEvents = { ...prev };
        delete newEvents[id];
        return newEvents;
      });
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar');
    }
  };

  const editEvent = (event) => {
    setEventForm(event);
    setEditingEventId(event.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setEventForm({
      categoria: 'reunion',
      titulo: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      ubicacion: '',
      observaciones: '',
      completado: false,
      recordatorio_habilitado: false,
      recordatorio_fecha: new Date().toISOString().split('T')[0],
      recordatorio_tipo: 'email',
      phone_number: ''
    });
    setEditingEventId(null);
  };

  const openMaps = (ubicacion) => {
    if (!ubicacion) {
      alert('Ingresa una ubicación primero');
      return;
    }
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(ubicacion)}`;
    window.open(mapsUrl, '_blank');
  };

  const toggleCompletado = async (event) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const updatedEvent = { ...event, completado: !event.completado };

      const { error } = await supabase
        .from('events')
        .update({ completado: updatedEvent.completado, updated_at: new Date().toISOString() })
        .eq('id', event.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setEvents(prev => ({
        ...prev,
        [event.id]: updatedEvent
      }));
    } catch (error) {
      console.error('Error actualizando evento:', error);
      alert('Error: ' + error.message);
    }
  };

  const getFilteredEvents = () => {
    return Object.values(events).filter(e =>
      filterCategoria === 'todas' ? true : e.categoria === filterCategoria
    );
  };

  const sortedEvents = getFilteredEvents().sort((a, b) =>
    new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
  );

  const upcomingEvents = sortedEvents.filter(e => !e.completado);
  const completedEvents = sortedEvents.filter(e => e.completado);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
      {/* Formulario */}
      <div style={{
        backgroundColor: card,
        border: `1px solid ${border}`,
        padding: '1.5rem',
        borderRadius: '1rem',
        height: 'fit-content',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: text, margin: '0 0 1rem 0' }}>
          {editingEventId ? '✏️ Editar' : '➕ Nuevo'} Evento
        </h2>

        {recordatorioMessage && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {recordatorioMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Categoría */}
          <div>
            <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Categoría
            </label>
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
                boxSizing: 'border-box'
              }}
            >
              {Object.entries(CATEGORIAS_EVENTOS).map(([key, cat]) => (
                <option key={key} value={key}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Título
            </label>
            <input
              type="text"
              placeholder="Ej: Reunión importante"
              value={eventForm.titulo}
              onChange={(e) => setEventForm({ ...eventForm, titulo: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${border}`,
                borderRadius: '0.5rem',
                backgroundColor: input,
                color: text,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Fecha */}
          <div>
            <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Fecha del Evento
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Ubicación */}
          <div>
            <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Ubicación
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej: Calle 10 #20-30, Bogotá"
                value={eventForm.ubicacion}
                onChange={(e) => setEventForm({ ...eventForm, ubicacion: e.target.value })}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `1px solid ${border}`,
                  borderRadius: '0.5rem',
                  backgroundColor: input,
                  color: text,
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => openMaps(eventForm.ubicacion)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Abrir en Google Maps"
              >
                <MapPin size={18} />
              </button>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label style={{ display: 'block', color: textSec, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Observaciones
            </label>
            <textarea
              placeholder="Detalles adicionales..."
              value={eventForm.observaciones}
              onChange={(e) => setEventForm({ ...eventForm, observaciones: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${border}`,
                borderRadius: '0.5rem',
                backgroundColor: input,
                color: text,
                minHeight: '80px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Checkbox Completado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="completado"
              checked={eventForm.completado}
              onChange={(e) => setEventForm({ ...eventForm, completado: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="completado" style={{ color: text, cursor: 'pointer', fontWeight: '500' }}>
              Evento completado
            </label>
          </div>

          {/* Recordatorio */}
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
            padding: '1rem',
            borderRadius: '0.5rem',
            borderLeft: '3px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                id="recordatorio"
                checked={eventForm.recordatorio_habilitado}
                onChange={(e) => setEventForm({ ...eventForm, recordatorio_habilitado: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="recordatorio" style={{ color: text, cursor: 'pointer', fontWeight: '600' }}>
                Configurar Recordatorio
              </label>
            </div>

            {eventForm.recordatorio_habilitado && (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', color: textSec, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Fecha del Recordatorio
                  </label>
                  <input
                    type="date"
                    value={eventForm.recordatorio_fecha}
                    onChange={(e) => setEventForm({ ...eventForm, recordatorio_fecha: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: input,
                      color: text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: textSec, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Método de Recordatorio
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEventForm({ ...eventForm, recordatorio_tipo: 'email' })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: eventForm.recordatorio_tipo === 'email' ? '#3b82f6' : border,
                        color: eventForm.recordatorio_tipo === 'email' ? 'white' : text,
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Mail size={16} /> Email
                    </button>
                    <button
                      onClick={() => setEventForm({ ...eventForm, recordatorio_tipo: 'whatsapp' })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: eventForm.recordatorio_tipo === 'whatsapp' ? '#10b981' : border,
                        color: eventForm.recordatorio_tipo === 'whatsapp' ? 'white' : text,
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: textSec, margin: '0.5rem 0 0 0' }}>
                    ℹ️ WhatsApp requiere integración con API (Twilio/Meta)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={addOrUpdateEvent}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Check size={18} /> {editingEventId ? 'Actualizar' : 'Guardar'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <X size={18} /> Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: text, margin: 0 }}>Mis Eventos</h2>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
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
              <Plus size={18} /> Nuevo Evento
            </button>
          </div>

          {/* Filtro */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            style={{
              padding: '0.75rem',
              border: `1px solid ${border}`,
              borderRadius: '0.5rem',
              backgroundColor: input,
              color: text,
              width: '100%'
            }}
          >
            <option value="todas">Todas las categorías</option>
            {Object.entries(CATEGORIAS_EVENTOS).map(([key, cat]) => (
              <option key={key} value={key}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        {/* Eventos Próximos */}
        {upcomingEvents.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: text, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} /> Próximos Eventos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {upcomingEvents.map(e => {
                const cat = CATEGORIAS_EVENTOS[e.categoria];
                const eventDate = new Date(e.fecha_inicio);
                const today = new Date();
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={e.id}
                    style={{
                      backgroundColor: card,
                      border: `2px solid ${cat?.color || '#3b82f6'}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{cat?.icon || '📅'}</span>
                          <h4 style={{ color: text, margin: 0, fontWeight: '600' }}>{e.titulo}</h4>
                          {daysUntil <= 3 && daysUntil >= 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontWeight: '600'
                            }}>
                              ⚠️ Próximo
                            </span>
                          )}
                        </div>

                        <p style={{ color: textSec, margin: '0.5rem 0', fontSize: '0.875rem' }}>
                          📅 {eventDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {daysUntil >= 0 && ` (En ${daysUntil} día${daysUntil !== 1 ? 's' : ''})`}
                        </p>

                        {e.ubicacion && (
                          <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>
                            📍 {e.ubicacion}
                          </p>
                        )}

                        {e.observaciones && (
                          <p style={{ color: textSec, margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            💬 {e.observaciones}
                          </p>
                        )}

                        {e.recordatorio_habilitado && (
                          <p style={{ color: '#f59e0b', margin: '0.5rem 0 0 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {e.recordatorio_tipo === 'email' ? <Mail size={14} /> : <MessageCircle size={14} />}
                            Recordatorio: {e.recordatorio_fecha}
                          </p>
                        )}
                      </div>

                      {/* Botones Acciones */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => editEvent(e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleCompletado(e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10b981',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}
                        >
                          <CheckCircle size={18} />
                        </button>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Eventos Completados */}
        {completedEvents.length > 0 && (
          <div>
            <h3 style={{ color: text, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> Eventos Completados
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {completedEvents.map(e => {
                const cat = CATEGORIAS_EVENTOS[e.categoria];
                const eventDate = new Date(e.fecha_inicio);

                return (
                  <div
                    key={e.id}
                    style={{
                      backgroundColor: darkMode ? '#1a3a1a' : '#f0fdf4',
                      border: `2px solid ${cat.color}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      opacity: 0.7
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                          <h4 style={{ color: text, margin: 0, fontWeight: '600', textDecoration: 'line-through' }}>
                            {e.titulo}
                          </h4>
                        </div>
                        <p style={{ color: textSec, margin: 0, fontSize: '0.875rem' }}>
                          {eventDate.toLocaleDateString('es-CO')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => toggleCompletado(e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10b981',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}
                        >
                          <CheckCircle size={18} />
                        </button>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.values(events).length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: textSec }}>
            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📅</p>
            <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>No hay eventos</h3>
            <p style={{ margin: 0 }}>Crea tu primer evento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppEvents;