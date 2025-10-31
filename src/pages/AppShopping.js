import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2 } from 'lucide-react';

const AppShopping = ({
  shoppingList,
  setShoppingList,
  events,
  setEvents,
  categories,
  darkMode,
  card,
  border,
  text,
  textSec,
  input,
  formatNumber
}) => {
  const [shoppingForm, setShoppingForm] = useState({
    item: '',
    cantidad: 1,
    categoria: 'alimentacion',
    precio: '',
    comprado: false
  });

  const [eventForm, setEventForm] = useState({
    categoria: 'Cita',
    titulo: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    ubicacion: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);

  const addShoppingItem = async () => {
    if (!shoppingForm.item) {
      alert('Por favor ingresa un nombre para el item');
      return;
    }
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      const newId = `shop_${Date.now()}`;
      const newItem = { 
        id: newId, 
        ...shoppingForm, 
        user_id: currentUser.id,
        created_at: new Date().toISOString() 
      };
      
      const { error } = await supabase
        .from('shopping_list')
        .upsert(newItem);
      
      if (error) throw error;
      
      setShoppingList(prev => ({ ...prev, [newId]: newItem }));
      setShoppingForm({ item: '', cantidad: 1, categoria: 'alimentacion', precio: '', comprado: false });
    } catch (error) {
      console.error('Error guardando item de compra:', error);
      alert('Error al guardar el item: ' + error.message);
    }
  };

  const toggleShoppingItem = async (id) => {
    try {
      const updatedItem = { ...shoppingList[id], comprado: !shoppingList[id].comprado };
      
      const { error } = await supabase
        .from('shopping_list')
        .update({ comprado: updatedItem.comprado })
        .eq('id', id);
      
      if (error) throw error;
      
      setShoppingList(prev => ({ ...prev, [id]: updatedItem }));
    } catch (error) {
      console.error('Error actualizando item:', error);
      alert('Error al actualizar el item: ' + error.message);
    }
  };

  const deleteShoppingItem = async (id) => {
    try {
      await supabase.from('shopping_list').delete().eq('id', id);
      const newList = {...shoppingList}; 
      delete newList[id]; 
      setShoppingList(newList); 
    } catch (error) {
      console.error('Error eliminando item:', error);
      alert('Error al eliminar el item');
    }
  };

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Compras */}
      <div>
        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Agregar Item a Compras</h2>
          <input type="text" placeholder="Nombre del item" value={shoppingForm.item} onChange={(e) => setShoppingForm({ ...shoppingForm, item: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <input type="number" placeholder="Cantidad" value={shoppingForm.cantidad} onChange={(e) => setShoppingForm({ ...shoppingForm, cantidad: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <select value={shoppingForm.categoria} onChange={(e) => setShoppingForm({ ...shoppingForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
          <input type="number" placeholder="Precio estimado" value={shoppingForm.precio} onChange={(e) => setShoppingForm({ ...shoppingForm, precio: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <button onClick={addShoppingItem} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={18} />Agregar a Lista
          </button>
        </div>

        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
          <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Lista de Compras</h2>
          {Object.values(shoppingList).length > 0 ? (
            <div>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: textSec }}>Total estimado: </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  ${formatNumber(Object.values(shoppingList).reduce((sum, item) => sum + (parseFloat(item.precio) || 0) * item.cantidad, 0))}
                </div>
              </div>
              {Object.values(shoppingList).map(item => {
                const cat = categories.find(c => c.id === item.categoria);
                return (
                  <div key={item.id} style={{ padding: '1rem', backgroundColor: item.comprado ? (darkMode ? '#1a3a1a' : '#f0fdf4') : (darkMode ? '#2a2a2a' : '#f9f9f9'), borderRadius: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.comprado ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={item.comprado} onChange={() => toggleShoppingItem(item.id)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: text, textDecoration: item.comprado ? 'line-through' : 'none' }}>{item.item}</div>
                        <div style={{ fontSize: '0.75rem', color: textSec }}>Cantidad: {item.cantidad} • {cat?.icon} {cat?.name} • ${formatNumber(parseFloat(item.precio || 0))}</div>
                      </div>
                    </div>
                    <button onClick={() => deleteShoppingItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: textSec, paddingTop: '2rem' }}>No hay items en la lista</p>
          )}
        </div>
      </div>

      {/* Eventos */}
      <div>
        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nuevo Evento</h2>
          <select value={eventForm.categoria} onChange={(e) => setEventForm({ ...eventForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
            <option value="Cita">Cita</option>
            <option value="Reunión">Reunión</option>
            <option value="Cumpleaños">Cumpleaños</option>
          </select>
          <input type="text" placeholder="Título" value={eventForm.titulo} onChange={(e) => setEventForm({ ...eventForm, titulo: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <input type="date" value={eventForm.fecha_inicio} onChange={(e) => setEventForm({ ...eventForm, fecha_inicio: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Ubicación" value={eventForm.ubicacion} onChange={(e) => setEventForm({ ...eventForm, ubicacion: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <button onClick={addEvent} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={18} />Agregar Evento
          </button>
        </div>

        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
          <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Eventos</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.values(events).map(e => (
              <div key={e.id} style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', border: `1px solid ${border}`, borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{e.titulo}</h3>
                  <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>{e.categoria}</p>
                  <p style={{ color: textSec, margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>📅 {e.fecha_inicio}</p>
                  {e.ubicacion && <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>📍 {e.ubicacion}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => deleteEvent(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShopping;