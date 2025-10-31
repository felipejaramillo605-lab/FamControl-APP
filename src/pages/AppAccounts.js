import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2 } from 'lucide-react';

const ACCOUNT_CATEGORIES = {
  efectivo: { name: 'Efectivo', icon: '💵', types: ['efectivo'] },
  debito: { 
    name: 'Débito', 
    icon: '📊',
    types: [
      { id: 'ahorro', name: 'Cuenta de Ahorro', icon: '🏦' },
      { id: 'billetera', name: 'Billetera Digital', icon: '👛' },
      { id: 'fiducia', name: 'Fiducia', icon: '📋' },
      { id: 'cdt', name: 'CDT', icon: '📈' },
      { id: 'inversion', name: 'Inversiones', icon: '💹' }
    ]
  },
  credito: { 
    name: 'Crédito', 
    icon: '💳',
    types: [
      { id: 'hipotecario', name: 'Crédito Hipotecario', icon: '🏠' },
      { id: 'prestamo', name: 'Préstamo', icon: '📌' },
      { id: 'tarjeta', name: 'Tarjeta de Crédito', icon: '💳' }
    ]
  }
};

const AppAccounts = ({ 
  accounts, 
  setAccounts, 
  darkMode, 
  card, 
  border, 
  text, 
  textSec, 
  input,
  formatNumber 
}) => {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    categoria: 'debito',
    tipo: '',
    saldo: 0
  });

  const getAccountTypes = (categoria) => {
    const catData = ACCOUNT_CATEGORIES[categoria];
    if (!catData) return [];
    if (categoria === 'efectivo') return [{ id: 'efectivo', name: 'Efectivo', icon: '💵' }];
    return catData.types || [];
  };

  const addAccount = async () => {
    if (!accountForm.name || !accountForm.tipo) {
      alert('Por favor completa todos los campos');
      return;
    }
  
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
    
      const newId = `account_${Date.now()}`;
    
      let finalSaldo = parseFloat(accountForm.saldo) || 0;
      if (accountForm.categoria === 'credito') {
        finalSaldo = -Math.abs(finalSaldo);
      } else {
        finalSaldo = Math.abs(finalSaldo);
      }
    
      const typeObj = Object.values(ACCOUNT_CATEGORIES)
        .find(cat => cat.types && cat.types.some(t => t.id === accountForm.tipo));
      const selectedType = typeObj?.types.find(t => t.id === accountForm.tipo);
    
      const newAccount = {
        id: newId,
        name: accountForm.name,
        icon: selectedType?.icon || '💰',
        tipo: accountForm.tipo,
        categoria: accountForm.categoria,
        saldo: finalSaldo,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      };
    
      const { error } = await supabase
        .from('accounts')
        .upsert(newAccount);
    
      if (error) throw error;
    
      setAccounts(prev => [...prev, newAccount]);
      setAccountForm({ name: '', categoria: 'debito', tipo: '', saldo: 0 });
      setShowAddAccount(false);
    
      console.log('✅ Cuenta guardada exitosamente');
    } catch (error) {
      console.error('Error guardando cuenta:', error);
      alert('Error al guardar la cuenta: ' + error.message);
    }
  };

  const deleteAccount = async (accountId) => {
    if (accountId === 'efectivo_default') {
      alert('No puedes eliminar la cuenta de efectivo predeterminada');
      return;
    }

    try {
      await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);
      
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      alert('Error al eliminar la cuenta: ' + error.message);
    }
  };

  const groupAccountsByCategory = () => {
    const grouped = {
      efectivo: [],
      debito: [],
      credito: []
    };
  
    accounts.forEach(acc => {
      if (acc.categoria === 'efectivo') grouped.efectivo.push(acc);
      else if (acc.categoria === 'debito') grouped.debito.push(acc);
      else if (acc.categoria === 'credito') grouped.credito.push(acc);
    });
  
    return grouped;
  };

  const grouped = groupAccountsByCategory();

  return (
    <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: text, margin: 0 }}>Mis Cuentas</h2>
        <button 
          onClick={() => setShowAddAccount(!showAddAccount)} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            cursor: 'pointer', 
            fontWeight: '600' 
          }}
        >
          <Plus size={18} /> Nueva Cuenta
        </button>
      </div>

      {showAddAccount && (
        <div style={{ 
          backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
          border: `1px solid ${border}`, 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ color: text, margin: '0 0 1rem 0' }}>Agregar Nueva Cuenta</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: textSec, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Ingresa el nombre de la cuenta
            </label>
            <input 
              type="text" 
              placeholder="ej: Bancolombia Ahorros" 
              value={accountForm.name} 
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} 
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: textSec, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Selecciona la categoría de la cuenta
            </label>
            <select 
              value={accountForm.categoria} 
              onChange={(e) => setAccountForm({ ...accountForm, categoria: e.target.value, tipo: '' })} 
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
              <option value="efectivo">💵 Efectivo</option>
              <option value="debito">📊 Débito (Dinero que tengo)</option>
              <option value="credito">💳 Crédito (Deuda)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: textSec, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Selecciona el tipo de cuenta
            </label>
            <select 
              value={accountForm.tipo} 
              onChange={(e) => setAccountForm({ ...accountForm, tipo: e.target.value })} 
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
              <option value="">Selecciona un tipo</option>
              {getAccountTypes(accountForm.categoria).map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: textSec, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              {accountForm.categoria === 'credito' ? 'Total adeudado' : 'Agrega saldo de la cuenta'}
            </label>
            <input 
              type="number" 
              placeholder="0" 
              value={accountForm.saldo} 
              onChange={(e) => setAccountForm({ ...accountForm, saldo: e.target.value })} 
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
            {accountForm.categoria === 'credito' && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.5rem 0 0 0' }}>
                ⚠️ Este monto se guardará como deuda (negativo)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={addAccount} 
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                backgroundColor: '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.5rem', 
                fontWeight: '600', 
                cursor: 'pointer' 
              }}
            >
              Guardar
            </button>
            <button 
              onClick={() => setShowAddAccount(false)} 
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                backgroundColor: '#6b7280', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.5rem', 
                fontWeight: '600', 
                cursor: 'pointer' 
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {grouped.efectivo.length > 0 && (
          <div>
            <h3 style={{ color: text, margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💵 Efectivo
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {grouped.efectivo.map(acc => (
                <div key={acc.id} style={{ 
                  padding: '1.5rem', 
                  backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
                  borderRadius: '0.75rem', 
                  border: `2px solid ${border}`,
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{acc.icon}</div>
                  <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{acc.name}</h3>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: acc.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                    ${formatNumber(acc.saldo || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {grouped.debito.length > 0 && (
          <div>
            <h3 style={{ color: text, margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Débito (Dinero que tengo)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {grouped.debito.map(acc => (
                <div key={acc.id} style={{ 
                  padding: '1.5rem', 
                  backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
                  borderRadius: '0.75rem', 
                  border: `2px solid #10b981`,
                  position: 'relative'
                }}>
                  <button 
                    onClick={() => deleteAccount(acc.id)} 
                    style={{ 
                      position: 'absolute', 
                      top: '0.75rem', 
                      right: '0.75rem', 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer' 
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{acc.icon}</div>
                  <h3 style={{ color: text, margin: '0 0 0.25rem 0' }}>{acc.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: textSec, margin: '0 0 0.5rem 0' }}>
                    {ACCOUNT_CATEGORIES.debito.types.find(t => t.id === acc.tipo)?.name}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
                    +${formatNumber(acc.saldo || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {grouped.credito.length > 0 && (
          <div>
            <h3 style={{ color: text, margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💳 Crédito (Deuda)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {grouped.credito.map(acc => (
                <div key={acc.id} style={{ 
                  padding: '1.5rem', 
                  backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
                  borderRadius: '0.75rem', 
                  border: `2px solid #ef4444`,
                  position: 'relative'
                }}>
                  <button 
                    onClick={() => deleteAccount(acc.id)} 
                    style={{ 
                      position: 'absolute', 
                      top: '0.75rem', 
                      right: '0.75rem', 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer' 
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{acc.icon}</div>
                  <h3 style={{ color: text, margin: '0 0 0.25rem 0' }}>{acc.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: textSec, margin: '0 0 0.5rem 0' }}>
                    {ACCOUNT_CATEGORIES.credito.types.find(t => t.id === acc.tipo)?.name}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
                    ${formatNumber(acc.saldo || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppAccounts;