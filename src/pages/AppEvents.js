import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Edit2, Check, X, MapPin, Mail, MessageCircle, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

// ============ CATEGORÍAS CONSTANTES ============
const CATEGORIAS_EVENTOS = {
  reunion: { name: 'Reunión', icon: '👥', color: '#3b82f6' },
  cumpleanos: { name: 'Cumpleaños', icon: '🎂', color: '#ec4899' },
  evento: { name: 'Evento', icon: '🎉', color: '#8b5cf6' },
  recordatorio: { name: 'Recordatorio', icon: '⏰', color: '#f59e0b' },
  tarea: { name: 'Tarea', icon: '✓', color: '#10b981' }
};

// ============ HELPER FUNCTIONS ============
const getEventCategory = (categoryId) => {
  const category = CATEGORIAS_EVENTOS[categoryId];
  if (!category) {
    console.warn(`⚠️ Categoría no encontrada: ${categoryId}, usando default`);
    return CATEGORIAS_EVENTOS.evento; // Default fallback
  }
  return category;
};

const validateEventData = (event) => {
  if (!event || !event.id) {
    console.error('❌ Evento inválido:', event);
    return false;
  }
  return true;
};

const safeGetEventProperty = (event, property, defaultValue = null) => {
  try {
    const value = event[property];
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error(`Error getting property ${property}:`, error);
    return defaultValue;
  }
};

// ============ COMPONENT ============
const AppEvents = ({
  events = {},
  setEvents,
  darkMode,
  card,
  border,
  text,
  textSec,
  input
}) => {
  // DEBUG: Log inicial
  console.log('🔍 AppEvents montado con eventos:', Object.keys(events || {}).length);

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
  const [debugMode, setDebugMode] = useState(false);

  // ============ EVENT HANDLERS ============
  const addOrUpdateEvent = async () => {
    console.log('📝 Agregando/Actualizando evento:', eventForm);

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
        titulo: eventForm.titulo || 'Sin título',
        categoria: eventForm.categoria || 'reunion',
        fecha_inicio: eventForm.fecha_inicio,
        ubicacion: eventForm.ubicacion || '',
        observaciones: eventForm.observaciones || '',
        completado: Boolean(eventForm.completado),
        recordatorio_habilitado: Boolean(eventForm.recordatorio_habilitado),
        recordatorio_fecha: eventForm.recordatorio_fecha || null,
        recordatorio_tipo: eventForm.recordatorio_tipo || 'email',
        phone_number: eventForm.phone_number || '',
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Guardando evento en Supabase:', newEvent);

      const { error } = await supabase
        .from('events')
        .upsert(newEvent);

      if (error) throw error;

      // Actualizar estado LOCAL de forma SEGURA
      setEvents(prev => {
        const updated = { ...prev, [newId]: newEvent };
        console.log('✅ Estado de eventos actualizado:', Object.keys(updated).length);
        return updated;
      });

      if (eventForm.recordatorio_habilitado) {
        setRecordatorioMessage(
          `✅ Recordatorio configurado para ${eventForm.recordatorio_fecha} vía ${eventForm.recordatorio_tipo === 'email' ? '📧 Email' : '💬 WhatsApp'}`
        );
        setTimeout(() => setRecordatorioMessage(''), 3000);
      }

      resetForm();
      setShowForm(false);
      console.log('✨ Evento guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando evento:', error);
      alert('Error al guardar: ' + error.message);
    }
  };

  const deleteEvent = async (id) => {
    console.log('🗑️  Eliminando evento:', id);

    if (!window.confirm('¿Eliminar este evento?')) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setEvents(prev => {
        const newEvents = { ...prev };
        delete newEvents[id];
        console.log('✅ Evento eliminado. Eventos restantes:', Object.keys(newEvents).length);
        return newEvents;
      });
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const editEvent = (event) => {
    console.log('✏️  Editando evento:', event);

    if (!validateEventData(event)) {
      alert('Evento inválido');
      return;
    }

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
    console.log('✅ Toggling evento:', event.id);

    if (!validateEventData(event)) {
      alert('Evento inválido');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const nuevoEstado = !Boolean(event.completado);
      const updatedEvent = { ...event, completado: nuevoEstado };

      const { error } = await supabase
        .from('events')
        .update({ 
          completado: nuevoEstado,
          updated_at: new Date().toISOString() 
        })
        .eq('id', event.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setEvents(prev => ({
        ...prev,
        [event.id]: updatedEvent
      }));

      console.log('✨ Estado actualizado');
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      alert('Error: ' + error.message);
    }
  };

  // ============ GETTERS ============
  const getFilteredEvents = () => {
    try {
      const eventsList = Object.values(events || {});
      console.log(`📊 Total de eventos: ${eventsList.length}`);

      const filtered = eventsList.filter(e => {
        // Validación ESTRICTA
        if (!e || !e.id) {
          console.warn('⚠️ Evento sin ID:', e);
          return false;
        }
        return filterCategoria === 'todas' ? true : e.categoria === filterCategoria;
      });

      console.log(`✅ Eventos filtrados (${filterCategoria}): ${filtered.length}`);
      return filtered;
    } catch (error) {
      console.error('❌ Error en getFilteredEvents:', error);
      return [];
    }
  };

  const sortedEvents = getFilteredEvents().sort((a, b) => {
    const dateA = new Date(a.fecha_inicio);
    const dateB = new Date(b.fecha_inicio);
    return dateA - dateB;
  });

  const upcomingEvents = sortedEvents.filter(e => !e.completado);
  const completedEvents = sortedEvents.filter(e => e.completado);

  console.log(`📅 Próximos: ${upcomingEvents.length}, Completados: ${completedEvents.length}`);

  // ============ RENDER HELPERS ============
  const renderEventCard = (e, isCompleted = false) => {
    try {
      if (!validateEventData(e)) {
        console.error('❌ No se puede renderizar evento:', e);
        return null;
      }

      const cat = getEventCategory(e.categoria);
      const eventDate = new Date(e.fecha_inicio);
      const today = new Date();
      const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

      return (
        <div
          key={e.id}
          style={{
            backgroundColor: card,
            border: `2px solid ${cat.color}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem',
            opacity: isCompleted ? 0.6 : 1
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                <h4 style={{ 
                  color: text, 
                  margin: 0, 
                  fontWeight: '600',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {e.titulo}
                </h4>
                {!isCompleted && daysUntil <= 3 && daysUntil >= 0 && (
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
                {!isCompleted && daysUntil >= 0 && ` (En ${daysUntil} día${daysUntil !== 1 ? 's' : ''})`}
              </p>

              {safeGetEventProperty(e, 'ubicacion') && (
                <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  📍 {e.ubicacion}
                </p>
              )}

              {safeGetEventProperty(e, 'observaciones') && (
                <p style={{ color: textSec, margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  💬 {e.observaciones}
                </p>
              )}

              {safeGetEventProperty(e, 'recordatorio_habilitado') && (
                <p style={{ color: '#f59e0b', margin: '0.5rem 0 0 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {e.recordatorio_tipo === 'email' ? <Mail size={14} /> : <MessageCircle size={14} />}
                  Recordatorio: {safeGetEventProperty(e, 'recordatorio_fecha', 'N/A')}
                </p>
              )}
            </div>

            {/* Botones Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              {!isCompleted && (
                <button
                  onClick={() => editEvent(e)}
                  title="Editar"
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
              )}
              <button
                onClick={() => toggleCompletado(e)}
                title={isCompleted ? "Reabrir" : "Completar"}
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
                title="Eliminar"
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
    } catch (error) {
      console.error('❌ Error renderizando evento:', error, e);
      return (
        <div key={e?.id || 'error'} style={{ 
          padding: '1rem', 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#991b1b',
          marginBottom: '1rem'
        }}>
          ❌ Error al renderizar evento
        </div>
      );
    }
  };

  // ============ MAIN RENDER ============
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
      {/* Formulario Sidebar */}
      <div style={{
        backgroundColor: card,
        border: `1px solid ${border}`,
        padding: '1.5rem',
        borderRadius: '1rem',
        height: 'fit-content',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: text, margin: 0 }}>
            {editingEventId ? '✏️ Editar' : '➕ Nuevo'} Evento
          </h2>
          <button
            onClick={() => setDebugMode(!debugMode)}
            title="Debug"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem'
            }}
          >
            🔍
          </button>
        </div>

        {debugMode && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f0f9ff',
            color: '#0c4a6e',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.75rem',
            maxHeight: '150px',
            overflowY: 'auto',
            fontFamily: 'monospace'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>DEBUG:</p>
            <p style={{ margin: '0.25rem 0' }}>Eventos: {Object.keys(events || {}).length}</p>
            <p style={{ margin: '0.25rem 0' }}>Filtro: {filterCategoria}</p>
            <p style={{ margin: '0.25rem 0' }}>Editando: {editingEventId || 'ninguno'}</p>
          </div>
        )}

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

          {/* Completado */}
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
                </div>
              </>
            )}
          </div>

          {/* Botones Acción */}
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
              <AlertCircle size={20} /> Próximos Eventos ({upcomingEvents.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingEvents.map(e => renderEventCard(e, false))}
            </div>
          </div>
        )}

        {/* Eventos Completados */}
        {completedEvents.length > 0 && (
          <div>
            <h3 style={{ color: text, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> Eventos Completados ({completedEvents.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {completedEvents.map(e => renderEventCard(e, true))}
            </div>
          </div>
        )}

        {/* Estado Vacío */}
        {Object.keys(events || {}).length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: textSec }}>
            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📅</p>
            <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>No hay eventos</h3>
            <p style={{ margin: 0 }}>Crea tu primer evento para empezar</p>
          </div>
        )}

        {/* Estado de Filtro Vacío */}
        {Object.keys(events || {}).length > 0 && sortedEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: textSec }}>
            <p style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>🔍</p>
            <p style={{ margin: 0 }}>No hay eventos en la categoría "{filterCategoria}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppEvents;