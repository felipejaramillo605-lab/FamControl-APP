import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Edit2, Check, X, Upload, Loader } from 'lucide-react';

const AppShopping = ({
  darkMode,
  card,
  border,
  text,
  textSec,
  input,
  formatNumber
}) => {
  const [shoppingLists, setShoppingLists] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState('');

  const [productForm, setProductForm] = useState({
    nombre: '',
    cantidad: 1,
    precio: ''
  });

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrMessage, setOcrMessage] = useState('');

  const createNewList = async () => {
    if (!newListName.trim()) {
      alert('Por favor ingresa un nombre para la lista');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const newId = `list_${Date.now()}`;
      const newList = {
        id: newId,
        nombre: newListName,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        productos: []
      };

      const { error } = await supabase
        .from('shopping_lists')
        .insert(newList);

      if (error) throw error;

      setShoppingLists(prev => ({ ...prev, [newId]: newList }));
      setSelectedListId(newId);
      setNewListName('');
      setShowCreateList(false);
    } catch (error) {
      console.error('Error creando lista:', error);
      alert('Error al crear la lista: ' + error.message);
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm('¿Estás seguro?')) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await supabase
        .from('shopping_list')
        .delete()
        .eq('id', listId)
        .eq('user_id', currentUser.id);

      const newLists = { ...shoppingLists };
      delete newLists[listId];
      setShoppingLists(newLists);
      if (selectedListId === listId) setSelectedListId(null);
    } catch (error) {
      console.error('Error eliminando lista:', error);
    }
  };

  const updateListName = async (listId) => {
    if (!editingListName.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const updatedList = { ...shoppingLists[listId], nombre: editingListName };

      const { error } = await supabase
        .from('shopping_list')
        .update({ nombre: editingListName })
        .eq('id', listId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setShoppingLists(prev => ({ ...prev, [listId]: updatedList }));
      setEditingListId(null);
      setEditingListName('');
    } catch (error) {
      console.error('Error actualizando lista:', error);
    }
  };

  const addProduct = async () => {
    if (!selectedListId) {
      alert('Por favor selecciona una lista');
      return;
    }

    if (!productForm.nombre.trim() || !productForm.precio) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentList = shoppingLists[selectedListId];
      const newProductId = `prod_${Date.now()}`;

      const newProduct = {
        id: newProductId,
        nombre: productForm.nombre,
        cantidad: parseInt(productForm.cantidad),
        precio: parseFloat(productForm.precio),
        comprado: false
      };

      const updatedProducts = [...(currentList.productos || []), newProduct];
      const updatedList = { ...currentList, productos: updatedProducts };

      const { error } = await supabase
        .from('shopping_list')
        .update({ productos: updatedProducts })
        .eq('id', selectedListId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setShoppingLists(prev => ({ ...prev, [selectedListId]: updatedList }));
      setProductForm({ nombre: '', cantidad: 1, precio: '' });
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error: ' + error.message);
    }
  };

  const processOCR = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedListId) {
      alert('Por favor selecciona una lista primero');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor sube un archivo PNG, JPG o PDF');
      return;
    }

    setOcrLoading(true);
    setOcrMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Usar Google Cloud Vision API o servicio OCR gratuito
      const response = await fetch('https://api.ocr.space/parse', {
        method: 'POST',
        body: formData,
        headers: {
          'apikey': '63687991272122' // API key gratuita OCR.space
        }
      });

      if (!response.ok) throw new Error('Error en OCR');

      const data = await response.json();
      
      if (!data.IsErroredOnProcessing) {
        const ocrText = data.ParsedText;
        const products = extractProductsFromOCR(ocrText);

        if (products.length > 0) {
          await addProductsFromOCR(products);
          setOcrMessage(`✅ Se agregaron ${products.length} producto(s) a la lista`);
        } else {
          setOcrMessage('⚠️ No se encontraron productos en la factura');
        }
      } else {
        setOcrMessage('❌ Error procesando la imagen');
      }

      setTimeout(() => setOcrMessage(''), 3000);
    } catch (error) {
      console.error('Error en OCR:', error);
      setOcrMessage('❌ Error al procesar la factura');
    } finally {
      setOcrLoading(false);
      setOcrFile(null);
    }
  };

  const extractProductsFromOCR = (text) => {
    const products = [];
    // Patrón simple para detectar: nombre cantidad precio
    const lines = text.split('\n');

    for (const line of lines) {
      // Buscar patrones como "Producto 2 5000" o "Leche 1 3500"
      const match = line.match(/([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:[.,]\d{1,2})?)/);
      
      if (match) {
        const nombre = match[1].trim();
        const cantidad = parseFloat(match[2]);
        const precio = parseFloat(match[3].replace(',', '.'));

        // Validar que tenga sentido
        if (nombre.length > 2 && cantidad > 0 && precio > 0) {
          products.push({ nombre, cantidad, precio });
        }
      }
    }

    // Remover duplicados
    return Array.from(new Map(products.map(p => [p.nombre.toLowerCase(), p])).values());
  };

  const addProductsFromOCR = async (products) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentList = shoppingLists[selectedListId];

      const newProducts = products.map((p, idx) => ({
        id: `prod_ocr_${Date.now()}_${idx}`,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        comprado: false
      }));

      const updatedProducts = [...(currentList.productos || []), ...newProducts];
      const updatedList = { ...currentList, productos: updatedProducts };

      const { error } = await supabase
        .from('shopping_list')
        .update({ productos: updatedProducts })
        .eq('id', selectedListId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setShoppingLists(prev => ({ ...prev, [selectedListId]: updatedList }));
    } catch (error) {
      console.error('Error agregando productos OCR:', error);
      throw error;
    }
  };

  const toggleProduct = async (productId) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentList = shoppingLists[selectedListId];

      const updatedProducts = currentList.productos.map(p =>
        p.id === productId ? { ...p, comprado: !p.comprado } : p
      );

      const { error } = await supabase
        .from('shopping_list')
        .update({ productos: updatedProducts })
        .eq('id', selectedListId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setShoppingLists(prev => ({
        ...prev,
        [selectedListId]: { ...currentList, productos: updatedProducts }
      }));
    } catch (error) {
      console.error('Error actualizando producto:', error);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentList = shoppingLists[selectedListId];

      const updatedProducts = currentList.productos.filter(p => p.id !== productId);

      const { error } = await supabase
        .from('shopping_list')
        .update({ productos: updatedProducts })
        .eq('id', selectedListId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setShoppingLists(prev => ({
        ...prev,
        [selectedListId]: { ...currentList, productos: updatedProducts }
      }));
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const getListTotal = (listId) => {
    const list = shoppingLists[listId];
    if (!list || !list.productos) return 0;
    return list.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  };

  const getListStats = (listId) => {
    const list = shoppingLists[listId];
    if (!list || !list.productos) return { total: 0, comprado: 0, pendiente: 0 };

    const total = list.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const compradoItems = list.productos.filter(p => p.comprado).length;

    return { total, comprado: compradoItems, pendiente: list.productos.length - compradoItems };
  };

  const currentList = selectedListId ? shoppingLists[selectedListId] : null;
  const stats = currentList ? getListStats(selectedListId) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
      {/* Sidebar */}
      <div style={{
        backgroundColor: card,
        border: `1px solid ${border}`,
        padding: '1.5rem',
        borderRadius: '1rem',
        height: 'fit-content'
      }}>
        <h2 style={{ color: text, margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Mis Listas</h2>

        <button
          onClick={() => setShowCreateList(!showCreateList)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={18} /> Nueva Lista
        </button>

        {showCreateList && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nombre de la lista"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${border}`,
                borderRadius: '0.5rem',
                backgroundColor: input,
                color: text,
                marginBottom: '0.5rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={createNewList}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}
            >
              Crear
            </button>
            <button
              onClick={() => setShowCreateList(false)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.entries(shoppingLists).map(([id, list]) => (
            <div
              key={id}
              onClick={() => setSelectedListId(id)}
              style={{
                padding: '1rem',
                backgroundColor: selectedListId === id ? '#2563eb' : (darkMode ? '#2a2a2a' : '#f9f9f9'),
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: selectedListId === id ? '2px solid #2563eb' : `1px solid ${border}`,
                color: selectedListId === id ? 'white' : text
              }}
            >
              {editingListId === id ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={editingListName}
                    onChange={(e) => setEditingListName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${border}`,
                      borderRadius: '0.25rem',
                      backgroundColor: input,
                      color: text
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateListName(id);
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontWeight: '600' }}>{list.nombre}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingListId(id);
                      setEditingListName(list.nombre);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <Edit2 size={14} color={selectedListId === id ? 'white' : text} />
                  </button>
                </div>
              )}
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Total: ${formatNumber(getListTotal(id))}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {list.productos?.length || 0} productos
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList(id);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: selectedListId === id ? 'rgba(239, 68, 68, 0.8)' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido Principal */}
      {currentList ? (
        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${border}` }}>
            <h2 style={{ color: text, margin: '0 0 1rem 0' }}>{currentList.nombre}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
                  ${formatNumber(stats.total)}
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Comprados</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>
                  {stats.comprado}/{currentList.productos?.length || 0}
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Pendientes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
                  {stats.pendiente}
                </p>
              </div>
            </div>
          </div>

          {/* OCR Section */}
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
            border: `2px dashed ${border}`,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer'
            }}>
              {ocrLoading ? (
                <>
                  <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: text, margin: 0, fontWeight: '600' }}>Procesando factura...</p>
                </>
              ) : (
                <>
                  <Upload size={32} color="#3b82f6" />
                  <div>
                    <p style={{ color: text, margin: '0 0 0.25rem 0', fontWeight: '600' }}>
                      Sube tu factura aquí
                    </p>
                    <p style={{ color: textSec, margin: 0, fontSize: '0.875rem' }}>
                      PNG, JPG o PDF - Se extraerán productos automáticamente
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={processOCR}
                disabled={ocrLoading}
                style={{ display: 'none' }}
              />
            </label>

            {ocrMessage && (
              <p style={{
                margin: '1rem 0 0 0',
                padding: '0.5rem 0.75rem',
                backgroundColor: ocrMessage.includes('✅') ? '#d1fae5' : ocrMessage.includes('❌') ? '#fee2e2' : '#fef3c7',
                color: ocrMessage.includes('✅') ? '#065f46' : ocrMessage.includes('❌') ? '#991b1b' : '#92400e',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                {ocrMessage}
              </p>
            )}
          </div>

          {/* Agregar Producto Manual */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${border}` }}>
            <h3 style={{ color: text, margin: '0 0 1rem 0' }}>Agregar Producto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Producto"
                value={productForm.nombre}
                onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${border}`,
                  borderRadius: '0.5rem',
                  backgroundColor: input,
                  color: text,
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="number"
                placeholder="Cant."
                value={productForm.cantidad}
                onChange={(e) => setProductForm({ ...productForm, cantidad: parseInt(e.target.value) || 1 })}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${border}`,
                  borderRadius: '0.5rem',
                  backgroundColor: input,
                  color: text,
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="number"
                placeholder="Precio"
                value={productForm.precio}
                onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${border}`,
                  borderRadius: '0.5rem',
                  backgroundColor: input,
                  color: text,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={addProduct}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
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
              <Plus size={18} /> Agregar Producto
            </button>
          </div>

          {/* Productos */}
          {currentList.productos && currentList.productos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentList.productos.map(product => (
                <div
                  key={product.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: product.comprado ? (darkMode ? '#1a3a1a' : '#f0fdf4') : (darkMode ? '#2a2a2a' : '#f9f9f9'),
                    borderRadius: '0.5rem',
                    border: `1px solid ${border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: product.comprado ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={product.comprado}
                      onChange={() => toggleProduct(product.id)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div>
                      <p style={{
                        color: text,
                        margin: 0,
                        textDecoration: product.comprado ? 'line-through' : 'none',
                        fontWeight: '500'
                      }}>
                        {product.nombre}
                      </p>
                      <p style={{ color: textSec, margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        {product.cantidad}x @ ${formatNumber(product.precio)} = ${formatNumber(product.cantidad * product.precio)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '0.5rem'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: textSec, padding: '2rem' }}>
              No hay productos. Sube una factura o agrega manualmente
            </p>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: card,
          border: `1px solid ${border}`,
          padding: '1.5rem',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <p style={{ color: textSec, textAlign: 'center', fontSize: '1.1rem' }}>
            👈 Crea o selecciona una lista
          </p>
        </div>
      )}
    </div>
  );
};

export default AppShopping;