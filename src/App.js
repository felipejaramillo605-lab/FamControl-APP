import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, LogOut, BarChart3, Calendar, DollarSign, Home, Moon, Sun, ShoppingCart, Wallet, TrendingUp, ArrowRightLeft, Download, Upload } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, ResponsiveContainer, Cell, Tooltip, XAxis, YAxis } from 'recharts';

const DEFAULT_CATEGORIES = [
  { id: 'alimentacion', name: 'Alimentación', color: '#10b981', icon: '🍔' },
  { id: 'transporte', name: 'Transporte', color: '#3b82f6', icon: '🚗' },
  { id: 'salud', name: 'Salud', color: '#ef4444', icon: '⚕️' },
  { id: 'entretenimiento', name: 'Entretenimiento', color: '#8b5cf6', icon: '🎮' },
  { id: 'servicios', name: 'Servicios', color: '#f59e0b', icon: '💡' },
  { id: 'educacion', name: 'Educación', color: '#06b6d4', icon: '📚' },
  { id: 'otros', name: 'Otros', color: '#6b7280', icon: '📦' }
];

const DEFAULT_ACCOUNTS = [
  { id: 'efectivo', name: 'Efectivo', icon: '💵', saldo: 0 },
  { id: 'banco', name: 'Banco', icon: '🏦', saldo: 0 },
  { id: 'tarjeta', name: 'Tarjeta', icon: '💳', saldo: 0 }
];

export default function FamControl() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [currentTab, setCurrentTab] = useState('home');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [categories] = useState(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [budgets, setBudgets] = useState({});
  const [shoppingList, setShoppingList] = useState({});
  const [transactions, setTransactions] = useState({});
  const [events, setEvents] = useState({});
  
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

  const [eventForm, setEventForm] = useState({
    categoria: 'Cita',
    titulo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    ubicacion: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);

  const [shoppingForm, setShoppingForm] = useState({
    item: '',
    cantidad: 1,
    categoria: 'alimentacion',
    precio: '',
    comprado: false
  });

  const [budgetForm, setBudgetForm] = useState({
    categoria: 'alimentacion',
    monto: '',
    mes: new Date().toISOString().slice(0, 7)
  });

  useEffect(() => {
    // Verificar sesión activa en Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userEmail = session.user.email;
        setUser(userEmail);
        localStorage.setItem('famcontrol_current_user', userEmail);
        
        // Cargar datos del usuario
        setTransactions(JSON.parse(localStorage.getItem(`transactions_${userEmail}`) || '{}'));
        setEvents(JSON.parse(localStorage.getItem(`events_${userEmail}`) || '{}'));
        setAccounts(JSON.parse(localStorage.getItem(`accounts_${userEmail}`)) || DEFAULT_ACCOUNTS);
        setBudgets(JSON.parse(localStorage.getItem(`budgets_${userEmail}`) || '{}'));
        setShoppingList(JSON.parse(localStorage.getItem(`shopping_${userEmail}`) || '{}'));
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`transactions_${user}`, JSON.stringify(transactions));
      localStorage.setItem(`events_${user}`, JSON.stringify(events));
      localStorage.setItem(`accounts_${user}`, JSON.stringify(accounts));
      localStorage.setItem(`budgets_${user}`, JSON.stringify(budgets));
      localStorage.setItem(`shopping_${user}`, JSON.stringify(shoppingList));
    }
  }, [transactions, events, accounts, budgets, shoppingList, user]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      if (registerMode) {
        // REGISTRO
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
        });
        
        if (error) {
          alert('Error al registrarse: ' + error.message);
          return;
        }
        
        alert('Registro exitoso! Ya puedes iniciar sesión');
        setRegisterMode(false);
        
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        
        if (error) {
          alert('Error al iniciar sesión: ' + error.message);
          return;
        }
        
        setUser(loginEmail);
        localStorage.setItem('famcontrol_current_user', loginEmail);
      }
      
      setLoginEmail('');
      setLoginPassword('');
      
    } catch (error) {
      console.error('Error en autenticación:', error);
      alert('Error inesperado. Intenta de nuevo.');
    }
  };

  const addTransaction = () => {
    if (!transactionForm.valor || !transactionForm.descripcion) return;
    
    const newId = editingId || Date.now().toString();
    const newTransaction = { id: newId, ...transactionForm, registradoPor: user, createdAt: new Date().toISOString() };
    
    setTransactions({ ...transactions, [newId]: newTransaction });
    
    if (transactionForm.tipo === 'transferencia' && transactionForm.cuentaDestino) {
      setAccounts(accounts.map(acc => {
        if (acc.id === transactionForm.cuenta) return { ...acc, saldo: (acc.saldo || 0) - parseFloat(transactionForm.valor) };
        if (acc.id === transactionForm.cuentaDestino) return { ...acc, saldo: (acc.saldo || 0) + parseFloat(transactionForm.valor) };
        return acc;
      }));
    } else {
      setAccounts(accounts.map(acc => {
        if (acc.id === transactionForm.cuenta) {
          const change = transactionForm.tipo === 'ingreso' ? parseFloat(transactionForm.valor) : -parseFloat(transactionForm.valor);
          return { ...acc, saldo: (acc.saldo || 0) + change };
        }
        return acc;
      }));
    }
    
    setTransactionForm({ fecha: new Date().toISOString().split('T')[0], descripcion: '', categoria: 'alimentacion', cuenta: 'efectivo', valor: '', tipo: 'gasto', cuentaDestino: '' });
    setEditingId(null);
  };

  const addEvent = () => {
    if (!eventForm.titulo) return;
    const newId = editingEventId || Date.now().toString();
    setEvents({ ...events, [newId]: { id: newId, ...eventForm } });
    setEventForm({ categoria: 'Cita', titulo: '', fechaInicio: new Date().toISOString().split('T')[0], ubicacion: '' });
    setEditingEventId(null);
  };

  const addShoppingItem = () => {
    if (!shoppingForm.item) return;
    const newId = Date.now().toString();
    setShoppingList({ ...shoppingList, [newId]: { ...shoppingForm, id: newId } });
    setShoppingForm({ item: '', cantidad: 1, categoria: 'alimentacion', precio: '', comprado: false });
  };

  const toggleShoppingItem = (id) => {
    setShoppingList({ ...shoppingList, [id]: { ...shoppingList[id], comprado: !shoppingList[id].comprado } });
  };

  const addBudget = () => {
    if (!budgetForm.monto) return;
    const key = `${budgetForm.categoria}-${budgetForm.mes}`;
    setBudgets({ ...budgets, [key]: budgetForm });
    setBudgetForm({ categoria: 'alimentacion', monto: '', mes: new Date().toISOString().slice(0, 7) });
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
    return { ingresos, gastos, gastosPorCategoria };
  };

  const getMonthlyTrend = () => {
    const data = {};
    Object.values(transactions).forEach(t => {
      const month = t.fecha.slice(0, 7);
      if (!data[month]) data[month] = { month, ingresos: 0, gastos: 0 };
      const valor = parseFloat(t.valor) || 0;
      if (t.tipo === 'ingreso') data[month].ingresos += valor;
      else if (t.tipo === 'gasto') data[month].gastos += valor;
    });
    return Object.values(data).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
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

  const bg = darkMode ? '#0a0a0a' : '#f5f5f5';
  const card = darkMode ? '#1a1a1a' : '#ffffff';
  const border = darkMode ? '#333' : '#e5e5e5';
  const text = darkMode ? '#ffffff' : '#000000';
  const textSec = darkMode ? '#999999' : '#666666';
  const input = darkMode ? '#2a2a2a' : '#ffffff';

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '28rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}>
              {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#666" />}
            </button>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: text, margin: '0 0 0.5rem 0' }}>FamControl v2</h1>
          <p style={{ textAlign: 'center', color: textSec, margin: '0 0 2rem 0' }}>Gestiona tus finanzas familiares</p>
          <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1.5rem', boxSizing: 'border-box' }} />
          <button onClick={handleLogin} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', marginBottom: '1rem' }}>
            {registerMode ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
          <button onClick={() => setRegisterMode(!registerMode)} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: '#2563eb', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}>
            {registerMode ? 'Volver al login' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    );
  }

  const { ingresos, gastos, gastosPorCategoria } = getFinancialSummary();
  const monthlyTrend = getMonthlyTrend();
  const budgetStatus = getBudgetStatus();
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.saldo || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg }}>
      <div style={{ backgroundColor: card, borderBottom: `1px solid ${border}`, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: text, margin: 0 }}>FamControl v2</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}>
            {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#666" />}
          </button>
          <span style={{ fontSize: '0.875rem', color: textSec }}>{user}</span>
          <button 
            onClick={async () => { 
              await supabase.auth.signOut(); 
              setUser(null); 
              localStorage.removeItem('famcontrol_current_user'); 
            }} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              cursor: 'pointer', 
              fontWeight: '500' 
            }}
          >
            <LogOut size={18} /> Salir
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: card, borderBottom: `1px solid ${border}`, padding: '0 2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'home', label: 'Inicio', icon: Home },
          { id: 'cuentas', label: 'Cuentas', icon: Wallet },
          { id: 'transacciones', label: 'Transacciones', icon: DollarSign },
          { id: 'presupuestos', label: 'Presupuestos', icon: TrendingUp },
          { id: 'compras', label: 'Compras', icon: ShoppingCart },
          { id: 'eventos', label: 'Eventos', icon: Calendar },
          { id: 'resumen', label: 'Resumen', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const active = currentTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setCurrentTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontWeight: '500', border: 'none', background: 'none', cursor: 'pointer', color: active ? '#2563eb' : textSec, borderBottom: active ? '2px solid #2563eb' : '2px solid transparent' }}>
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        {currentTab === 'home' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Balance Total</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: totalBalance >= 0 ? '#10b981' : '#ef4444' }}>${totalBalance.toLocaleString()}</p>
              </div>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Ingresos (mes)</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>${ingresos.toLocaleString()}</p>
              </div>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Gastos (mes)</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>${gastos.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Tendencia Mensual</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTrend}>
                    <XAxis dataKey="month" stroke={textSec} />
                    <YAxis stroke={textSec} />
                    <Tooltip />
                    <Bar dataKey="ingresos" fill="#10b981" />
                    <Bar dataKey="gastos" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Cuentas</h2>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: text }}>{acc.icon} {acc.name}</span>
                    <span style={{ fontWeight: 'bold', color: acc.saldo >= 0 ? '#10b981' : '#ef4444' }}>${(acc.saldo || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'cuentas' && (
          <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 style={{ color: text, margin: '0 0 1.5rem 0' }}>Mis Cuentas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ padding: '1.5rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.75rem', border: `2px solid ${border}` }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{acc.icon}</div>
                  <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{acc.name}</h3>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: acc.saldo >= 0 ? '#10b981' : '#ef4444' }}>${(acc.saldo || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'transacciones' && (
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
                          {t.tipo === 'ingreso' ? '+' : '-'}${parseFloat(t.valor).toLocaleString()}
                        </span>
                        <button onClick={() => { const newTx = {...transactions}; delete newTx[t.id]; setTransactions(newTx); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'presupuestos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
              <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nuevo Presupuesto</h2>
              <select value={budgetForm.categoria} onChange={(e) => setBudgetForm({ ...budgetForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
              <input type="month" value={budgetForm.mes} onChange={(e) => setBudgetForm({ ...budgetForm, mes: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
              <input type="number" placeholder="Monto presupuesto" value={budgetForm.monto} onChange={(e) => setBudgetForm({ ...budgetForm, monto: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
              <button onClick={addBudget} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} />Crear Presupuesto
              </button>
            </div>

            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ color: text, margin: '0 0 1.5rem 0' }}>Estado de Presupuestos</h2>
              {budgetStatus.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {budgetStatus.map(b => (
                    <div key={b.categoria} style={{ padding: '1.5rem', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', borderRadius: '0.75rem', border: b.alerta ? '2px solid #ef4444' : `1px solid ${border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: text }}>{b.categoria}</span>
                        <span style={{ fontSize: '0.875rem', color: b.alerta ? '#ef4444' : textSec }}>{b.porcentaje.toFixed(0)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: border, borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: `${b.porcentaje}%`, height: '100%', backgroundColor: b.alerta ? '#ef4444' : b.color, transition: 'width 0.3s' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: textSec }}>
                        <span>Gastado: ${b.gastado.toLocaleString()}</span>
                        <span>Presupuesto: ${b.presupuesto.toLocaleString()}</span>
                      </div>
                      {b.alerta && <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>⚠️ Alerta: Has superado el 80% del presupuesto</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: textSec, paddingTop: '2rem' }}>No hay presupuestos configurados para este mes</p>
              )}
            </div>
          </div>
        )}

        {currentTab === 'compras' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
              <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Agregar Item</h2>
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
                      ${Object.values(shoppingList).reduce((sum, item) => sum + (parseFloat(item.precio) || 0) * item.cantidad, 0).toLocaleString()}
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
                            <div style={{ fontSize: '0.75rem', color: textSec }}>Cantidad: {item.cantidad} • {cat?.icon} {cat?.name} • ${parseFloat(item.precio || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        <button onClick={() => { const newList = {...shoppingList}; delete newList[item.id]; setShoppingList(newList); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
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
        )}

        {currentTab === 'eventos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
              <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nuevo Evento</h2>
              <select value={eventForm.categoria} onChange={(e) => setEventForm({ ...eventForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
                <option value="Cita">Cita</option>
                <option value="Reunión">Reunión</option>
                <option value="Cumpleaños">Cumpleaños</option>
              </select>
              <input type="text" placeholder="Título" value={eventForm.titulo} onChange={(e) => setEventForm({ ...eventForm, titulo: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
              <input type="date" value={eventForm.fechaInicio} onChange={(e) => setEventForm({ ...eventForm, fechaInicio: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
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
                      <p style={{ color: textSec, margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>📅 {e.fechaInicio}</p>
                      {e.ubicacion && <p style={{ color: textSec, margin: '0.25rem 0', fontSize: '0.875rem' }}>📍 {e.ubicacion}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { const newEvents = {...events}; delete newEvents[e.id]; setEvents(newEvents); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'resumen' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Resumen Financiero</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: textSec }}>Ingresos:</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>${ingresos.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: textSec }}>Gastos:</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>${gastos.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: text }}>Balance:</span>
                  <span style={{ fontWeight: 'bold', color: ingresos - gastos >= 0 ? '#10b981' : '#ef4444' }}>${(ingresos - gastos).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Gastos por Categoría</h2>
              {Object.keys(gastosPorCategoria).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                      {Object.entries(gastosPorCategoria).map((_, i) => {
                        const colors = ['#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#6b7280'];
                        return <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: textSec, paddingTop: '2rem' }}>Sin datos para mostrar</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}