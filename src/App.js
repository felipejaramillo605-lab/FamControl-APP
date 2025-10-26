import { useSettingsStore } from './stores/settings';
import SettingsModal from './components/SettingsModal';
import DailyQuote from './components/DailyQuote';
import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, LogOut, BarChart3, Calendar, DollarSign, Home, Moon, Sun, ShoppingCart, Wallet, TrendingUp, ArrowRightLeft, Download, Upload, Target, Star } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, ResponsiveContainer, Cell, Tooltip, XAxis, YAxis } from 'recharts';

const DEFAULT_CATEGORIES = [
  { id: 'alimentacion', name: 'Alimentación', icon: '🍔', color: '#ef4444' },
  { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: '🎬', color: '#8b5cf6' },
  { id: 'salud', name: 'Salud', icon: '⚕️', color: '#10b981' },
  { id: 'educacion', name: 'Educación', icon: '📚', color: '#f59e0b' },
  { id: 'servicios', name: 'Servicios', icon: '💡', color: '#06b6d4' },
  { id: 'compras', name: 'Compras', icon: '🛍️', color: '#ec4899' },
  { id: 'otros', name: 'Otros', icon: '📦', color: '#6b7280' }
];

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

const DEFAULT_ACCOUNTS = [
  { id: 'efectivo_default', name: 'Efectivo', icon: '💵', saldo: 0, tipo: 'efectivo', categoria: 'efectivo' }
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
  const [goals, setGoals] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const settingsStore = useSettingsStore();
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    currentSaved: '0',
    category: 'viaje'
  });
  const [showAddGoal, setShowAddGoal] = useState(false);
  
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
    fecha_inicio: new Date().toISOString().split('T')[0],
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

  const [accountForm, setAccountForm] = useState({
    name: '',
    categoria: 'debito',
    tipo: '',
    saldo: 0
  });
  const [showAddAccount, setShowAddAccount] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const { data: { session }, error } = await supabase.auth.getSession();
      
        if (error) {
          console.error('Error de Supabase:', error);
          return;
        }
      
        if (session?.user) {
          const userEmail = session.user.email;
          const userId = session.user.id;
          setUser(userEmail);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('famcontrol_current_user', userEmail);
          }
        
          await loadUserData(userId);
          await debugSync(userId);
        }
      } catch (error) {
        console.error('Error crítico:', error);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    settingsStore.loadSettings();
    settingsStore.loadRandomQuote();
  }, []);

  const debugSync = async (userId) => {
    console.log('🔍 DEBUG Sincronización');
    
    const { data: remoteTx, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    
    console.log('Transacciones en Supabase:', remoteTx?.length || 0);
    console.log('Transacciones locales:', Object.values(transactions).length);
    
    if (error) {
      console.error('Error en sync:', error);
    }
    
    return remoteTx;
  };

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('accounts').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Conexión con Supabase establecida');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión con Supabase:', error);
      alert('Error de conexión con la base de datos. Recarga la página.');
      return false;
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      if (registerMode) {
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
        setLoginEmail('');
        setLoginPassword('');
        
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        
        if (error) {
          alert('Error al iniciar sesión: ' + error.message);
          return;
        }
        
        setUser(loginEmail);
        if (typeof window !== 'undefined') {
          localStorage.setItem('famcontrol_current_user', loginEmail);
        }
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await loadUserData(currentUser.id);
        }
        await checkSupabaseConnection();
      }
      
      setLoginEmail('');
      setLoginPassword('');
      
    } catch (error) {
      console.error('Error en autenticación:', error);
      alert('Error inesperado. Intenta de nuevo.');
    }
  };

  const loadUserData = async (userId) => {
    try {
      if (typeof window === 'undefined') return;
      
      console.log('🔄 Cargando datos para usuario:', userId);
      
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (accountsError) {
        console.error('Error cargando cuentas:', accountsError);
        throw accountsError;
      }
    
      if (accountsData && accountsData.length > 0) {
        console.log('✅ Cuentas cargadas:', accountsData.length);
        const updatedAccounts = accountsData.map(acc => ({
          ...acc,
          categoria: acc.categoria || 'debito'
        }));
        setAccounts(updatedAccounts);
      } else {
        console.log('🆕 Creando cuentas predeterminadas');
        const defaultAccs = DEFAULT_ACCOUNTS.map(acc => ({
          ...acc,
          user_id: userId
        }));
        const { error: insertError } = await supabase.from('accounts').insert(defaultAccs);
        if (insertError) {
          console.error('Error creando cuentas predeterminadas:', insertError);
          throw insertError;
        }
        setAccounts(DEFAULT_ACCOUNTS);
      }

      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      if (transError) {
        console.error('Error cargando transacciones:', transError);
        throw transError;
      }
    
      const transObj = {};
      transData?.forEach(t => { 
        transObj[t.id] = {
          ...t,
          cuentaDestino: t.cuenta_destino
        }; 
      });
      console.log('✅ Transacciones cargadas:', Object.keys(transObj).length);
      setTransactions(transObj);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
      
      if (budgetError) {
        console.error('Error cargando presupuestos:', budgetError);
        throw budgetError;
      }
    
      const budgetObj = {};
      budgetData?.forEach(b => { 
        const key = `${b.categoria}-${b.mes}`;
        budgetObj[key] = b; 
      });
      console.log('✅ Presupuestos cargados:', Object.keys(budgetObj).length);
      setBudgets(budgetObj);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);
      
      if (eventError) {
        console.error('Error cargando eventos:', eventError);
        throw eventError;
      }
    
      const eventObj = {};
      eventData?.forEach(e => { 
        eventObj[e.id] = {
          ...e,
          fecha_inicio: e.fecha_inicio
        }; 
      });
      console.log('✅ Eventos cargados:', Object.keys(eventObj).length);
      setEvents(eventObj);

      const { data: shoppingData, error: shoppingError } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId);
      
      if (shoppingError) {
        console.error('Error cargando lista de compras:', shoppingError);
        throw shoppingError;
      }
    
      const shoppingObj = {};
      shoppingData?.forEach(s => { shoppingObj[s.id] = s; });
      console.log('✅ Items de compra cargados:', Object.keys(shoppingObj).length);
      setShoppingList(shoppingObj);

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);
      
      if (goalsError) {
        console.error('Error cargando metas:', goalsError);
      } else {
        const goalsObj = {};
        goalsData?.forEach(g => { goalsObj[g.id] = g; });
        console.log('✅ Metas cargadas:', Object.keys(goalsObj).length);
        setGoals(goalsObj);
      }

      console.log('🎉 Todos los datos cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('Error cargando datos: ' + error.message);
    }
  };

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
              newSaldo -= parseFloat(transactionForm.valor); // Decrease source account
            } else if (transactionForm.tipo === 'ingreso') {
              newSaldo += parseFloat(transactionForm.valor); // Increase for income
            } else if (transactionForm.tipo === 'gasto') {
              newSaldo -= parseFloat(transactionForm.valor); // Decrease for expense
            }
            await supabase.from('accounts').update({ saldo: newSaldo }).eq('id', acc.id).eq('user_id', currentUser.id);
            return { ...acc, saldo: newSaldo };
          }
          if (transactionForm.tipo === 'transferencia' && acc.id === transactionForm.cuentaDestino) {
            const newSaldo = (acc.saldo || 0) + parseFloat(transactionForm.valor); // Increase destination account
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
  
    return ingresos - gastos;
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
    const hasTransactions = Object.values(transactions).some(
      t => t.cuenta === accountId || t.cuentaDestino === accountId
    );
    
    if (hasTransactions) {
      const confirm = window.confirm(
        'Esta cuenta tiene transacciones asociadas. ¿Estás seguro de eliminarla? Las transacciones no se eliminarán.'
      );
      if (!confirm) return;
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

  const getIconForType = (type) => {
    const icons = {
      banco: '🏦',
      tarjeta: '💳',
      efectivo: '💵',
      billetera: '👛',
      ahorro: '🐷'
    };
    return icons[type] || '💰';
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

  const getAccountTypes = (categoria) => {
    const catData = ACCOUNT_CATEGORIES[categoria];
    if (!catData) return [];
    if (categoria === 'efectivo') return [{ id: 'efectivo', name: 'Efectivo', icon: '💵' }];
    return catData.types || [];
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

  const totalBalance = accounts.reduce((sum, acc) => {
    let saldo = acc.saldo || 0;
    if (acc.categoria === 'credito' && saldo > 0) {
      saldo = -saldo;
    }
    return sum + saldo;
  }, 0);

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
  const monthlySavings = getMonthlySavings();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg }}>
      <div style={{ backgroundColor: card, borderBottom: `1px solid ${border}`, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: text, margin: 0 }}>
          {settingsStore.settings.app_name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none', 
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              cursor: 'pointer'
            }}
            title="Configuración"
          >
            ⚙️
          </button>

          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}>
            {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#666" />}
          </button>
          <span style={{ fontSize: '0.875rem', color: textSec }}>{user}</span>
          <button 
            onClick={async () => { 
              try {
                await supabase.auth.signOut(); 
                setUser(null);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('famcontrol_current_user');
                }
              } catch (error) {
                console.error('Error al cerrar sesión:', error);
              }
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
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Ahorro Mensual</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: monthlySavings >= 0 ? '#10b981' : '#ef4444' }}>${monthlySavings.toLocaleString()}</p>
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

            {Object.values(goals).length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                  <h2 style={{ color: text, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} /> Mis Metas Destacadas
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {Object.values(goals).slice(0, 3).map(goal => {
                      const progress = getGoalProgress(goal);
                      return (
                        <div key={goal.id} style={{ 
                          padding: '1.5rem', 
                          backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
                          borderRadius: '0.75rem', 
                          border: `2px solid ${border}`,
                          position: 'relative'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{getGoalIcon(goal.category)}</div>
                          <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{goal.name}</h3>
                          <div style={{ width: '100%', height: '8px', backgroundColor: border, borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ 
                              width: `${progress.percentage}%`, 
                              height: '100%', 
                              backgroundColor: progress.percentage >= 100 ? '#10b981' : '#3b82f6',
                              transition: 'width 0.3s' 
                            }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: textSec }}>
                            <span>${progress.saved.toLocaleString()} / ${progress.target.toLocaleString()}</span>
                            <span>{progress.percentage.toFixed(0)}%</span>
                          </div>
                          {progress.percentage >= 100 && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '0.75rem', 
                              right: '0.75rem', 
                              background: '#10b981', 
                              color: 'white', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '600' 
                            }}>
                              ¡Logrado! 🎉
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <DailyQuote />
          </div>
        )}

        {currentTab === 'cuentas' && (
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

            {(() => {
              const grouped = groupAccountsByCategory();
              return (
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
                            {!['efectivo_default'].includes(acc.id) && (
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
                            )}
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{acc.icon}</div>
                            <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{acc.name}</h3>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: acc.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                              ${(acc.saldo || 0).toLocaleString()}
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
                              {Object.values(ACCOUNT_CATEGORIES.debito.types).find(t => t.id === acc.tipo)?.name}
                            </p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
                              +${(acc.saldo || 0).toLocaleString()}
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
                              {Object.values(ACCOUNT_CATEGORIES.credito.types).find(t => t.id === acc.tipo)?.name}
                            </p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
                              ${(acc.saldo || 0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
        )}

        {currentTab === 'presupuestos' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem', height: 'fit-content' }}>
                <h2 style={{ color: text, margin: '0 0 1rem 0' }}>Nuevo Presupuesto</h2>
                <select value={budgetForm.categoria} onChange={(e) => setBudgetForm({ ...budgetForm, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
                <input type="month" value={budgetForm.mes} onChange={(e) => setBudgetForm({ ...budgetForm, mes: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
                <input type="number" placeholder="Monto presupuesto" value={budgetForm.monto} onChange={(e) => setBudgetForm({ ...budgetForm, monto: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} />
                <button onClick={addBudget} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '0.5rem',