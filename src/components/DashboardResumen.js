// src/components/DashboardResumen.js
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { TrendingUp, AlertCircle, Target, Wallet, DollarSign, PieChart as PieIcon } from 'lucide-react';

const DashboardResumen = ({ transactions = [], accounts = [], goals = [], budgets = {} }) => {
  const [filterPeriod, setFilterPeriod] = useState('6months');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ============ CÁLCULOS GENERALES ============
  const calculateMetrics = useMemo(() => {
    const now = new Date();
    let txns = [...transactions];

    // Filtrar por período
    if (filterPeriod === '3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      txns = txns.filter(t => new Date(t.fecha) >= threeMonthsAgo);
    } else if (filterPeriod === '6months') {
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      txns = txns.filter(t => new Date(t.fecha) >= sixMonthsAgo);
    } else if (filterPeriod === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      txns = txns.filter(t => new Date(t.fecha) >= yearAgo);
    }

    const ingresos = txns
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

    const gastos = txns
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

    const efectivoDisponible = accounts
      .filter(a => a.categoria === 'efectivo')
      .reduce((sum, a) => sum + (a.saldo || 0), 0);

    const ahorros = accounts
      .filter(a => a.categoria === 'debito')
      .reduce((sum, a) => sum + (a.saldo || 0), 0);

    const deudas = accounts
      .filter(a => a.categoria === 'credito')
      .reduce((sum, a) => sum + Math.abs(a.saldo || 0), 0);

    const patrimonioNeto = efectivoDisponible + ahorros - deudas;
    const ahorro = ingresos - gastos;

    // Gastos por categoría
    const gastosPorCategoria = {};
    txns
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + parseFloat(t.valor);
      });

    return {
      ingresos,
      gastos,
      ahorro,
      patrimonioNeto,
      efectivoDisponible,
      ahorros,
      deudas,
      gastosPorCategoria,
      transacciones: txns
    };
  }, [transactions, accounts, filterPeriod]);

  // ============ DATOS PARA GRÁFICAS ============
  const flujoMensual = useMemo(() => {
    const meses = {};
    const now = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toLocaleString('es-CO', { month: 'short', year: '2-digit' });
      meses[key] = { ingresos: 0, gastos: 0, ahorro: 0 };
    }

    // Llenar datos
    calculateMetrics.transacciones.forEach(t => {
      const fecha = new Date(t.fecha);
      const key = fecha.toLocaleString('es-CO', { month: 'short', year: '2-digit' });
      if (meses[key]) {
        if (t.tipo === 'ingreso') {
          meses[key].ingresos += parseFloat(t.valor);
        } else if (t.tipo === 'gasto') {
          meses[key].gastos += parseFloat(t.valor);
        }
      }
    });

    // Calcular ahorro por mes
    return Object.entries(meses).map(([mes, data]) => ({
      mes,
      ingresos: Math.round(data.ingresos),
      gastos: Math.round(data.gastos),
      ahorro: Math.round(data.ingresos - data.gastos)
    }));
  }, [calculateMetrics]);

  // Distribución Patrimonial
  const distribucionPatrimonial = useMemo(() => {
    return [
      { name: 'Efectivo', value: Math.max(0, calculateMetrics.efectivoDisponible) },
      { name: 'Ahorros/Inversión', value: Math.max(0, calculateMetrics.ahorros) },
      { name: 'Deudas', value: calculateMetrics.deudas }
    ].filter(item => item.value > 0);
  }, [calculateMetrics]);

  // Gastos por categoría
  const gastosPorCategoriaData = useMemo(() => {
    return Object.entries(calculateMetrics.gastosPorCategoria)
      .map(([cat, valor]) => ({ name: cat, value: Math.round(valor) }))
      .sort((a, b) => b.value - a.value);
  }, [calculateMetrics]);

  // ============ INDICADORES KPI ============
  const kpis = useMemo(() => {
    const gastosMensuales = calculateMetrics.gastos / 6;
    const ahorrosMensuales = calculateMetrics.ahorros;
    const fondoEmergencia = ahorrosMensuales / gastosMensuales;
    const ratioEndeudamiento = calculateMetrics.deudas / (calculateMetrics.patrimonioNeto + calculateMetrics.deudas);
    const capacidadAhorro = (calculateMetrics.ahorro / calculateMetrics.ingresos) * 100;
    const liquidezInmediata = calculateMetrics.efectivoDisponible / gastosMensuales;
    const diasAutonomia = (calculateMetrics.efectivoDisponible / gastosMensuales) * 30;

    const progresoMetas = goals.length > 0
      ? (Object.values(goals).reduce((sum, g) => {
          const saved = (parseFloat(g.current_saved) || 0);
          const target = (parseFloat(g.target_amount) || 0);
          return sum + (target > 0 ? (saved / target) * 100 : 0);
        }, 0) / goals.length)
      : 0;

    return {
      fondoEmergencia: Math.round(fondoEmergencia * 10) / 10,
      ratioEndeudamiento: Math.round(ratioEndeudamiento * 100),
      capacidadAhorro: Math.round(capacidadAhorro),
      liquidezInmediata: Math.round(liquidezInmediata * 10) / 10,
      diasAutonomia: Math.round(diasAutonomia),
      progresoMetas: Math.round(progresoMetas)
    };
  }, [calculateMetrics, goals]);

  // Colores
  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4'];

  // ============ COMPONENTE TARJETA KPI ============
  const KPICard = ({ icon: Icon, titulo, valor, unidad, alerta, color }) => (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${color || '#e5e5e5'}`,
      borderRadius: '0.75rem',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        padding: '0.75rem',
        backgroundColor: `${color}20`,
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
          {titulo}
        </p>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          {valor} <span style={{ fontSize: '0.875rem', color: '#999' }}>{unidad}</span>
        </p>
        {alerta && (
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: alerta.color }}>
            {alerta.texto}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* HEADER CON FILTROS */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
          📊 Resumen Financiero
        </h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['3months', '6months', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filterPeriod === period ? '#1976d2' : '#e5e5e5',
                color: filterPeriod === period ? 'white' : '#333',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {period === '3months' ? 'Últimos 3 meses' : period === '6months' ? 'Últimos 6 meses' : 'Último año'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs PRINCIPALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <KPICard
          icon={Wallet}
          titulo="Fondo de Emergencia"
          valor={kpis.fondoEmergencia}
          unidad="meses"
          alerta={kpis.fondoEmergencia < 3 ? { color: '#ef4444', texto: '⚠️ Por debajo del recomendado' } : null}
          color="#10b981"
        />
        <KPICard
          icon={DollarSign}
          titulo="Ratio Endeudamiento"
          valor={kpis.ratioEndeudamiento}
          unidad="%"
          alerta={kpis.ratioEndeudamiento > 50 ? { color: '#ef4444', texto: '⚠️ Endeudamiento alto' } : null}
          color="#ef4444"
        />
        <KPICard
          icon={TrendingUp}
          titulo="Capacidad Ahorro"
          valor={kpis.capacidadAhorro}
          unidad="%"
          color="#3b82f6"
        />
        <KPICard
          icon={Target}
          titulo="Progreso Metas"
          valor={kpis.progresoMetas}
          unidad="%"
          color="#8b5cf6"
        />
      </div>

      {/* GRÁFICAS PRINCIPALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Flujo Mensual */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
            📈 Flujo Mensual (Ingresos vs Gastos)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={flujoMensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
              <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
              <Line dataKey="ahorro" stroke="#3b82f6" name="Ahorro" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución Patrimonial */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
            🥧 Distribución Patrimonial
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribucionPatrimonial}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distribucionPatrimonial.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gastos por Categoría */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
            💰 Análisis de Gastos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={gastosPorCategoriaData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen de Indicadores */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
            📋 Indicadores de Liquidez
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Liquidez Inmediata</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {kpis.liquidezInmediata}x
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(kpis.liquidezInmediata * 25, 100)}%`,
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s'
                }} />
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                Puedes vivir {kpis.diasAutonomia} días sin ingresos
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Ratio Deuda/Patrimonio</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {kpis.ratioEndeudamiento}%
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${kpis.ratioEndeudamiento}%`,
                  backgroundColor: kpis.ratioEndeudamiento > 50 ? '#ef4444' : '#f59e0b',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Capacidad de Ahorro</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                  {kpis.capacidadAhorro}%
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${kpis.capacidadAhorro}%`,
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTAS Y RECOMENDACIONES */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> Alertas y Recomendaciones
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {kpis.fondoEmergencia < 3 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              borderLeft: '4px solid #ef4444'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#991b1b' }}>
                ⚠️ Fondo de Emergencia Bajo
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d' }}>
                Tienes {kpis.fondoEmergencia} meses de gastos ahorrados. Se recomienda tener entre 3-6 meses.
              </p>
            </div>
          )}

          {kpis.ratioEndeudamiento > 50 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '0.5rem',
              borderLeft: '4px solid #f59e0b'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#92400e' }}>
                ⚠️ Endeudamiento Elevado
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#654321' }}>
                Tu ratio de endeudamiento es {kpis.ratioEndeudamiento}%. Considera priorizar el pago de deudas.
              </p>
            </div>
          )}

          {kpis.capacidadAhorro > 20 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#d1fae5',
              border: '1px solid '#a7f3d0',
              borderRadius: '0.5rem',
              borderLeft: '4px solid #10b981'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#065f46' }}>
                ✅ Excelente Capacidad de Ahorro
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>
                Estás ahorrando el {kpis.capacidadAhorro}% de tus ingresos. ¡Buen trabajo!
              </p>
            </div>
          )}

          {gastosPorCategoriaData.length > 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem',
              borderLeft: '4px solid #3b82f6'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#1e40af' }}>
                💡 Categoría con Mayor Gasto
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>
                {gastosPorCategoriaData[0].name} representa tu mayor gasto: ${gastosPorCategoriaData[0].value.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardResumen;