import { useSettingsStore } from './stores/settings';
import SettingsModal from './components/SettingsModal';
import DailyQuote from './components/DailyQuote';
import DashboardResumen from './components/DashboardResumen';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import { Plus, LogOut, BarChart3, Calendar, DollarSign, Home, Moon, Sun, ShoppingCart, Wallet } from 'lucide-react';

// Importar componentes modularizados
import AppAccounts from './pages/AppAccounts';
import AppTransactions from './pages/AppTransactions';
import AppShopping from './pages/AppShopping';

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
  const [currentTab, setCurrentTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [userRole, setUserRole] = useState('user');

  // Estados de datos
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [budgets, setBudgets] = useState({});
  const [shoppingList, setShoppingList] = useState({});
  const [transactions, setTransactions] = useState({});
  const [events, setEvents] = useState({});
  const [goals, setGoals] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const settingsStore = useSettingsStore();

  // ============ EFECTOS Y AUTENTICACIÓN ============

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
        }
      } catch (error) {
        console.error('Error crítico:', error);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    const initializeSettings = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 0));
        
        if (settingsStore && typeof settingsStore.loadSettings === 'function') {
          await settingsStore.loadSettings();
        }
        
        if (settingsStore && typeof settingsStore.loadDailyQuote === 'function') {
          await settingsStore.loadDailyQuote();
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
      }
    };

    initializeSettings();
  }, [settingsStore]);

  // ============ FUNCIONES DE AUTENTICACIÓN ============

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
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: { email_confirm: false }
          }
        });
        
        if (error) {
          alert('Error al registrarse: ' + error.message);
          return;
        }
        
        if (data.user) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
          });
          
          if (signInError) {
            alert('Registro exitoso, pero error al iniciar sesión: ' + signInError.message);
            return;
          }
          
          setUser(loginEmail);
          localStorage.setItem('famcontrol_current_user', loginEmail);
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await loadUserData(currentUser.id);
          }
        }
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
        localStorage.setItem('famcontrol_current_user', loginEmail);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await loadUserData(currentUser.id);
        }
      }
      
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error('Error en autenticación:', error);
      alert('Error inesperado. Intenta de nuevo.');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      alert('Por favor ingresa tu email');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetMessage('Se ha enviado un correo para restablecer tu contraseña');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============ CARGA DE DATOS ============

  const loadUserData = async (userId) => {
    try {
      if (typeof window === 'undefined') return;
      
      console.log('🔄 Cargando datos para usuario:', userId);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔍 Usuario autenticado:', currentUser?.email);
      
      // Cargar cuentas
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (accountsError) throw accountsError;
      
      if (accountsData && accountsData.length > 0) {
        const updatedAccounts = accountsData.map(acc => ({
          ...acc,
          categoria: acc.categoria || 'debito'
        }));
        setAccounts(updatedAccounts);
      } else {
        const defaultAccs = DEFAULT_ACCOUNTS.map(acc => ({
          ...acc,
          user_id: userId
        }));
        await supabase.from('accounts').insert(defaultAccs);
        setAccounts(DEFAULT_ACCOUNTS);
      }

      // Cargar transacciones
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      if (transError) throw transError;
      
      const transObj = {};
      transData?.forEach(t => { 
        transObj[t.id] = { ...t, cuentaDestino: t.cuenta_destino }; 
      });
      setTransactions(transObj);

      // Cargar presupuestos
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
      
      if (budgetError) throw budgetError;
      
      const budgetObj = {};
      budgetData?.forEach(b => { 
        const key = `${b.categoria}-${b.mes}`;
        budgetObj[key] = b; 
      });
      setBudgets(budgetObj);

      // Cargar eventos
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);
      
      if (eventError) throw eventError;
      
      const eventObj = {};
      eventData?.forEach(e => { 
        eventObj[e.id] = { ...e, fecha_inicio: e.fecha_inicio }; 
      });
      setEvents(eventObj);

      // Cargar lista de compras
      const { data: shoppingData, error: shoppingError } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId);
      
      if (shoppingError) throw shoppingError;
      
      const shoppingObj = {};
      shoppingData?.forEach(s => { shoppingObj[s.id] = s; });
      setShoppingList(shoppingObj);

      // Cargar metas
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);
      
      if (goalsError) throw goalsError;
      
      const goalsObj = {};
      goalsData?.forEach(g => { goalsObj[g.id] = g; });
      setGoals(goalsObj);

      // Cargar rol
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        setUserRole('user');
      } else {
        setUserRole(profileData?.role || 'user');
      }

      // Admin temporal para testing
      if (currentUser?.email === 'felipejaramillo605@gmail.com') {
        setUserRole('admin');
      }

      console.log('🎉 Todos los datos cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('Error cargando datos: ' + error.message);
    }
  };

  // ============ HELPERS ============

  const totalBalance = accounts.reduce((sum, acc) => {
    let saldo = acc.saldo || 0;
    if (acc.categoria === 'credito' && saldo > 0) {
      saldo = -saldo;
    }
    return sum + saldo;
  }, 0);

  const formatNumber = (number) => {
    if (typeof number !== 'number' || isNaN(number)) {
      return '0';
    }
    const useSeparator = settingsStore?.settings?.thousands_separator !== false;
    return useSeparator ? number.toLocaleString('es-CO') : number.toString();
  };

  const bg = darkMode ? '#0a0a0a' : '#f5f5f5';
  const card = darkMode ? '#1a1a1a' : '#ffffff';
  const border = darkMode ? '#333' : '#e5e5e5';
  const text = darkMode ? '#ffffff' : '#000000';
  const textSec = darkMode ? '#999999' : '#666666';
  const input = darkMode ? '#2a2a2a' : '#ffffff';

  // ============ RENDER DE LOGIN ============

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '28rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}>
              {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#666" />}
            </button>
          </div>

          {!showForgotPassword ? (
            <>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: text, margin: '0 0 0.5rem 0' }}>FamControl v2</h1>
              <p style={{ textAlign: 'center', color: textSec, margin: '0 0 2rem 0' }}>Gestiona tus finanzas familiares</p>
              
              <input 
                type="email" 
                placeholder="Email" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '1rem', boxSizing: 'border-box' }} 
              />
              
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '0.75rem', border: `1px solid ${border}`, borderRadius: '0.5rem', backgroundColor: input, color: text, marginBottom: '0.5rem', boxSizing: 'border-box' }} 
              />
              
              {!registerMode && (
                <button 
                  onClick={() => setShowForgotPassword(true)} 
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    backgroundColor: 'transparent', 
                    color: '#2563eb', 
                    border: 'none', 
                    textAlign: 'right',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
              
              <button 
                onClick={handleLogin} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  marginBottom: '1rem'
                }}
              >
                {registerMode ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
              
              <button 
                onClick={() => setRegisterMode(!registerMode)} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: 'transparent', 
                  color: '#2563eb', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  fontWeight: '600', 
                  cursor: 'pointer' 
                }}
              >
                {registerMode ? 'Volver al login' : '¿No tienes cuenta? Regístrate'}
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: text, margin: '0 0 1rem 0' }}>
                Restablecer Contraseña
              </h2>
              <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
              
              {resetMessage && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#d1fae5', 
                  color: '#065f46', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {resetMessage}
                </div>
              )}
              
              <input 
                type="email" 
                placeholder="Email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
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
                onClick={handleForgotPassword} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  marginBottom: '0.5rem' 
                }}
              >
                Enviar enlace
              </button>
              
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  backgroundColor: 'transparent', 
                  color: '#6b7280', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  fontWeight: '600', 
                  cursor: 'pointer' 
                }}
              >
                Volver al login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============ RENDER PRINCIPAL ============

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg }}>
      {/* Header */}
      <div style={{ backgroundColor: card, borderBottom: `1px solid ${border}`, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: text, margin: 0 }}>
          {settingsStore.settings?.app_name || 'FamControl v2'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}
            title="Configuración"
          >
            ⚙️
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setShowAdminDashboard(true)}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}
              title="Panel de Administración"
            >
              👑
            </button>
          )}

          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: darkMode ? '#333' : '#f0f0f0', cursor: 'pointer' }}>
            {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#666" />}
          </button>
          <span style={{ fontSize: '0.875rem', color: textSec }}>{user}</span>
          <button 
            onClick={async () => { 
              try {
                await supabase.auth.signOut(); 
                setUser(null);
                localStorage.removeItem('famcontrol_current_user');
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

      {/* Tabs */}
      <div style={{ backgroundColor: card, borderBottom: `1px solid ${border}`, padding: '0 2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'home', label: 'Inicio', icon: Home },
          { id: 'cuentas', label: 'Cuentas', icon: Wallet },
          { id: 'transacciones', label: 'Transacciones', icon: DollarSign },
          { id: 'presupuestos', label: 'Presupuestos', icon: BarChart3 },
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

      {/* Contenido */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        {currentTab === 'home' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: card, border: `1px solid ${border}`, padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ color: textSec, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Balance Total</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: totalBalance >= 0 ? '#10b981' : '#ef4444' }}>${formatNumber(totalBalance)}</p>
              </div>
            </div>
            <DailyQuote />
          </div>
        )}

        {currentTab === 'cuentas' && (
          <AppAccounts 
            accounts={accounts}
            setAccounts={setAccounts}
            darkMode={darkMode}
            card={card}
            border={border}
            text={text}
            textSec={textSec}
            input={input}
            ACCOUNT_CATEGORIES={ACCOUNT_CATEGORIES}
            DEFAULT_ACCOUNTS={DEFAULT_ACCOUNTS}
            formatNumber={formatNumber}
          />
        )}

        {currentTab === 'transacciones' && (
          <AppTransactions 
            transactions={transactions}
            setTransactions={setTransactions}
            accounts={accounts}
            setAccounts={setAccounts}
            categories={categories}
            darkMode={darkMode}
            card={card}
            border={border}
            text={text}
            textSec={textSec}
            input={input}
            formatNumber={formatNumber}
          />
        )}

        {currentTab === 'compras' && (
          <AppShopping 
            shoppingList={shoppingList}
            setShoppingList={setShoppingList}
            events={events}
            setEvents={setEvents}
            categories={categories}
            darkMode={darkMode}
            card={card}
            border={border}
            text={text}
            textSec={textSec}
            input={input}
            formatNumber={formatNumber}
          />
        )}

        {currentTab === 'resumen' && (
          <DashboardResumen 
            transactions={Object.values(transactions)}
            accounts={accounts}
            goals={Object.values(goals)}
            budgets={Object.values(budgets)}
          />
        )}
      </div>

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      {showAdminDashboard && (
        <AdminDashboard 
          onClose={() => setShowAdminDashboard(false)} 
          darkMode={darkMode}
        />
      )}
    </div>
  );
}