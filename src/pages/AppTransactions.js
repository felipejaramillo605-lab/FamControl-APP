import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Download } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

const AppTransactions = ({
  transactions,
  setTransactions,
  accounts,
  setAccounts,
  categories,
  darkMode,
  card,
  border,
  text,
  textSec,
  input,
  formatNumber
}) => {
  const [transactionForm, setTransactionForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoria: 'alimentacion',
    cuenta: 'efectivo',
    valor: '',
    tipo: 'gasto',
    cuentaDestino: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('mes');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    currentSaved: '0',
    category: 'viaje'
  });
  const [goals, setGoals] = useState({});
  const [budgets, setBudgets] = useState({});
  const [budgetForm, setBudgetForm] = useState({
    categoria: 'alimentacion',
    monto: '',
    mes: new Date().toISOString().slice(0, 7)
  });

  const addTransaction = async () => {
    if (!transactionForm.valor || !transactionForm.descripcion) {
      alert('Por favor completa descripción y valor');
      return;
    }
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
    
      const newId = editingId || `trans_${Date.now()}`;
      
      const transactionData = {
        id: newId,
        fecha: transactionForm.fecha,
        descripcion: transactionForm.descripcion,
        categoria: transactionForm.categoria,
        cuenta: transactionForm.cuenta,
        valor: parseFloat(transactionForm.valor),
        tipo: transactionForm.tipo,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      if (transactionForm.tipo === 'transferencia' && transactionForm.cuentaDestino) {
        transactionData.cuenta_destino = transactionForm.cuentaDestino;
      }
    
      const { error } = await supabase
        .from('transactions')
        .upsert(transactionData);
      
      if (error) throw error;
    
      setTransactions(prev => ({ 
        ...prev, 
        [newId]: {
          ...transactionData,
          cuentaDestino: transactionForm.cuentaDestino
        }
      }));
      
      const updatedAccounts = await Promise.all(
        accounts.map(async (acc) => {
          if (acc.id === transactionForm.cuenta) {
            let newSaldo = acc.saldo || 0;
            if (transactionForm.tipo === 'transferencia' && transactionForm.cuentaDestino) {
              newSaldo -= parseFloat(transactionForm.valor);
            } else if (transactionForm.tipo === 'ingreso') {
              newSaldo += parseFloat(transactionForm.valor);
            } else if (transactionForm.tipo === 'gasto') {
              newSaldo -= parseFloat(transactionForm.valor);
            }
            await supabase.from('accounts').update({ saldo: newSaldo }).eq('id', acc.id).eq('user_id', currentUser.id);
            return { ...acc, saldo: newSaldo };
          }
          if (transactionForm.tipo === 'transferencia' && acc.id === transactionForm.cuentaDestino) {
            const newSaldo = (acc.saldo || 0) + parseFloat(transactionForm.valor);
            await supabase.from('accounts').update({ saldo: newSaldo }).eq('id', acc.id).eq('user_id', currentUser.id);
            return { ...acc, saldo: newSaldo };
          }
          return acc;
        })
      );
      setAccounts(updatedAccounts);
      
      setTransactionForm({ 
        fecha: new Date().toISOString().split('T')[0], 
        descripcion: '', 
        categoria: 'alimentacion', 
        cuenta: 'efectivo', 
        valor: '', 
        tipo: 'gasto', 
        cuentaDestino: '' 
      });
      setEditingId(null);
      
      console.log('✅ Transacción guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando transacción:', error);
      alert('Error al guardar la transacción: ' + error.message);
    }
  };

  const addBudget = async () => {
    if (!budgetForm.monto) {
      alert('Por favor ingresa un monto para el presupuesto');
      return;
    }
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      const key = `${budgetForm.categoria}-${budgetForm.mes}`;
      const newBudget = { 
        id: key, 
        ...budgetForm, 
        user_id: currentUser.id,
        created_at: new Date().toISOString() 
      };
      
      const { error } = await supabase
        .from('budgets')
        .upsert(newBudget);
      
      if (error) throw error;
      
      setBudgets(prev => ({ ...prev, [key]: newBudget }));
      setBudgetForm({ categoria: 'alimentacion', monto: '', mes: new Date().toISOString().slice(0, 7) });
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      alert('Error al guardar el presupuesto: ' + error.message);
    }
  };

  const addGoal = async () => {
    if (!goalForm.name || !goalForm.targetAmount) {
      alert('Por favor ingresa nombre y monto objetivo para la meta');
      return;
    }
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      const newId = `goal_${Date.now()}`;
      const newGoal = {
        id: newId,
        name: goalForm.name,
        target_amount: parseFloat(goalForm.targetAmount),
        target_date: goalForm.targetDate,
        current_saved: parseFloat(goalForm.currentSaved) || 0,
        category: goalForm.category,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('goals')
        .upsert(newGoal);
      
      if (error) throw error;
      
      setGoals(prev => ({ ...prev, [newId]: newGoal }));
      setGoalForm({ 
        name: '', 
        targetAmount: '', 
        targetDate: '', 
        currentSaved: '0',
        category: 'viaje'
      });
      setShowAddGoal(false);
      
      console.log('✅ Meta guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando meta:', error);
      alert('Error al guardar la meta: ' + error.message);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      
      setGoals(prev => {
        const newGoals = { ...prev };
        delete newGoals[goalId];
        return newGoals;
      });
    } catch (error) {
      console.error('Error eliminando meta:', error);
      alert('Error al eliminar la meta: ' + error.message);
    }
  };

  const getGoalProgress = (goal) => {
    const target = parseFloat(goal.target_amount) || 1;
    const saved = parseFloat(goal.current_saved) || 0;
    const percentage = (saved / target) * 100;
    return {
      percentage: Math.min(percentage, 100),
      remaining: target - saved,
      saved: saved,
      target: target
    };
  };

  const getMonthlySavings = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTx = Object.values(transactions).filter(t => 
      t.fecha.startsWith(currentMonth)
    );
    
    let ingresos = monthTx
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
    
    let gastos = monthTx
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

    return Math.round(ingresos - gastos);
  };

  const getGoalIcon = (category) => {
    const icons = {
      viaje: '✈️',
      casa: '🏠',
      auto: '🚗',
      educacion: '🎓',
      salud: '⚕️',
      tecnologia: '💻',
      otros: '🎯'
    };
    return icons[category] || '🎯';
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Tipo', 'Valor'];
    const rows = Object.values(transactions).map(t => [t.fecha, t.descripcion, t.categoria, t.cuenta, t.tipo, t.valor]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `famcontrol_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    let filtered = Object.values(transactions);
    if (filterPeriod === 'mes') {
      filtered = filtered.filter(t => new Date(t.fecha).getMonth() === now.getMonth() && new Date(t.fecha).getFullYear() === now.getFullYear());
    }
    if (filterCategory !== 'todas') filtered = filtered.filter(t => t.categoria === filterCategory);
    return filtered;
  };

  const getFinancialSummary = () => {
    const filtered = getFilteredTransactions();
    let ingresos = 0, gastos = 0;
    const gastosPorCategoria = {};
    filtered.forEach(t => {
      const valor = parseFloat(t.valor) || 0;
      if (t.tipo === 'ingreso') ingresos += valor;
      else if (t.tipo === 'gasto') {
        gastos += valor;
        const cat = categories.find(c => c.id === t.categoria);
        gastosPorCategoria[cat?.name || t.categoria] = (gastosPorCategoria[cat?.name || t.categoria] || 0) + valor;
      }
    });
    return { 
      ingresos: Math.round(ingresos),
      gastos: Math.round(gastos), 
      gastosPorCategoria: Object.fromEntries(
        Object.entries(gastosPorCategoria).map(([k, v]) => [k, Math.round(v)])
      )
    };
  };

  const getBudgetStatus = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTx = Object.values(transactions).filter(t => t.fecha.startsWith(currentMonth) && t.tipo === 'gasto');
    return categories.map(cat => {
      const budget = budgets[`${cat.id}-${currentMonth}`];
      if (!budget) return null;
      const spent = monthTx.filter(t => t.categoria === cat.id).reduce((sum, t) => sum + parseFloat(t.valor), 0);
      const percentage = (spent / parseFloat(budget.monto)) * 100;
      return { categoria: cat.name, color: cat.color, presupuesto: parseFloat(budget.monto), gastado: spent, porcentaje: Math.min(percentage, 100), alerta: percentage >= 80 };
    }).filter(b => b);
  };

  const { ingresos, gastos, gastosPorCategoria } = getFinancialSummary();
  const budgetStatus = getBudgetStatus();
  const monthlySavings = getMonthlySavings();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
      <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
        <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nueva Transacción</h2>
        <input type="date" value={transactionForm.fecha} onChange={(e) => setTransactionForm({ ...transactionForm, fecha: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
        <input type="text" placeholder="Descripción" value={transactionForm.descripcion} onChange={(e) => setTransactionForm({ ...transactionForm, descripcion: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
        <select value={transactionForm.tipo} onChange={(e) => setTransactionForm({ ...transactionForm, tipo: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <select value={transactionForm.categoria} onChange={(e) => setTransactionForm({ ...transactionForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
        </select>
        <select value={transactionForm.cuenta} onChange={(e) => setTransactionForm({ ...transactionForm, cuenta: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>)}
        </select>
        {transactionForm.tipo === 'transferencia' && (
          <select value={transactionForm.cuentaDestino} onChange={(e) => setTransactionForm({ ...transactionForm, cuentaDestino: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
            <option value="">A cuenta...</option>
            {accounts.filter(a => a.id !== transactionForm.cuenta).map(acc => <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>)}
          </select>
        )}
        <input type="number" placeholder="Valor" value={transactionForm.valor} onChange={(e) => setTransactionForm({ ...transactionForm, valor: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
        <button onClick={addTransaction} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Plus size={18} />Agregar
        </button>
      </div>

      <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ color: text, margin: 0 }}>Historial</h2>
          <button onClick={exportToCSV} style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> CSV
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={{ padding: '0.5rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text }}>
            <option value="todos">Todos</option>
            <option value="mes">Este mes</option>
            <option value="año">Este año</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '0.5rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text }}>
            <option value="todas">Todas</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {getFilteredTransactions().map(t => {
            const cat = categories.find(c => c.id === t.categoria);
            const acc = accounts.find(a => a.id === t.cuenta);
            return (
              <div key={t.id} style={{ padding: '1rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: text, marginBottom: '0.25rem' }}>{t.descripcion}</div>
                  <div style={{ fontSize: '0.75rem', color: textSec }}>{t.fecha} • {cat?.icon} {cat?.name} • {acc?.icon} {acc?.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 'bold', color: t.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}>
                    {t.tipo === 'ingreso' ? '+' : '-'}${formatNumber(Math.round(parseFloat(t.valor) || 0))}
                  </span>
                  <button onClick={async () => { 
                    try {
                      const { data: { user: currentUser } } = await supabase.auth.getUser();
                      if (!currentUser) throw new Error('No hay usuario autenticado');
                      
                      const account = accounts.find(a => a.id === t.cuenta);
                      if (account) {
                        let revertChange = 0;
                        if (t.tipo === 'ingreso') {
                          revertChange = -parseFloat(t.valor);
                        } else if (t.tipo === 'gasto') {
                          revertChange = parseFloat(t.valor);
                        } else if (t.tipo === 'transferencia' && t.cuentaDestino) {
                          revertChange = parseFloat(t.valor);
                          const destinationAccount = accounts.find(a => a.id === t.cuentaDestino);
                          if (destinationAccount) {
                            const destinationRevert = -parseFloat(t.valor);
                            const newDestinationSaldo = (destinationAccount.saldo || 0) + destinationRevert;
                            const { error: updateDestError } = await supabase
                              .from('accounts')
                              .update({ saldo: newDestinationSaldo })
                              .eq('id', destinationAccount.id)
                              .eq('user_id', currentUser.id);
                            if (updateDestError) throw updateDestError;
                            const updatedAccountsDest = accounts.map(acc => 
                              acc.id === t.cuentaDestino ? { ...acc, saldo: newDestinationSaldo } : acc
                            );
                            setAccounts(updatedAccountsDest);
                          }
                        }
                        const newSaldo = (account.saldo || 0) + revertChange;
                        const { error: updateError } = await supabase
                          .from('accounts')
                          .update({ saldo: newSaldo })
                          .eq('id', account.id)
                          .eq('user_id', currentUser.id);
                        if (updateError) throw updateError;
                        const updatedAccounts = accounts.map(acc => 
                          acc.id === t.cuenta ? { ...acc, saldo: newSaldo } : acc
                        );
                        setAccounts(updatedAccounts);
                      }
                      const { error: deleteError } = await supabase
                        .from('transactions')
                        .delete()
                        .eq('id', t.id)
                        .eq('user_id', currentUser.id);
                      if (deleteError) throw deleteError;
                      const newTx = {...transactions}; 
                      delete newTx[t.id]; 
                      setTransactions(newTx);
                      console.log('✅ Transacción eliminada y saldo revertido correctamente');
                    } catch (error) {
                      console.error('Error eliminando transacción:', error);
                      alert('Error al eliminar la transacción: ' + error.message);
                    }
                  }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppTransactions;