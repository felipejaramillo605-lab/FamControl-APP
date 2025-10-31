import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';

const BUDGET_CATEGORIES = {
  fijo: { 
    name: 'Gasto Fijo', 
    icon: '📅', 
    description: 'Gastos mensuales recurrentes como servicios, alquiler, etc.',
    color: '#3b82f6'
  },
  meta: { 
    name: 'Meta', 
    icon: '🎯', 
    description: 'Objetivos financieros específicos con plazo definido.',
    color: '#10b981'
  },
  sueno: { 
    name: 'Sueño', 
    icon: '✨', 
    description: 'Metas a largo plazo y aspiraciones financieras.',
    color: '#8b5cf6'
  }
};

const AppBudgets = ({
  budgets,
  setBudgets,
  customBudgets,
  setCustomBudgets,
  transactions,
  accounts,
  darkMode,
  card,
  border,
  text,
  textSec,
  input,
  formatNumber,
  categories
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: 'fijo',
    target_amount: '',
    current_saved: '0',
    payment_installments: [],
    description: ''
  });

  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.target_amount) {
      alert('Por favor completa el nombre y el monto objetivo');
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const budgetData = {
        ...newBudget,
        id: editingBudget ? editingBudget.id : Date.now().toString(),
        target_amount: parseFloat(newBudget.target_amount),
        current_saved: parseFloat(newBudget.current_saved),
        created_at: new Date().toISOString(),
        user_id: currentUser.id
      };

      if (editingBudget) {
        setCustomBudgets(prev => ({
          ...prev,
          [budgetData.id]: budgetData
        }));
        
        const { error } = await supabase
          .from('custom_budgets')
          .update(budgetData)
          .eq('id', budgetData.id);
          
        if (error) console.error('Error updating budget:', error);
      } else {
        setCustomBudgets(prev => ({
          ...prev,
          [budgetData.id]: budgetData
        }));
        
        const { error } = await supabase
          .from('custom_budgets')
          .insert([budgetData]);
          
        if (error) console.error('Error creating budget:', error);
      }

      setShowCreateModal(false);
      setEditingBudget(null);
      setNewBudget({
        name: '',
        category: 'fijo',
        target_amount: '',
        current_saved: '0',
        payment_installments: [],
        description: ''
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Error al crear el presupuesto: ' + error.message);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return;
    
    try {
      setCustomBudgets(prev => {
        const newBudgets = { ...prev };
        delete newBudgets[budgetId];
        return newBudgets;
      });
      
      const { error } = await supabase
        .from('custom_budgets')
        .delete()
        .eq('id', budgetId);
        
      if (error) console.error('Error deleting budget:', error);
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Error al eliminar el presupuesto: ' + error.message);
    }
  };

  const addPaymentInstallment = () => {
    setNewBudget(prev => ({
      ...prev,
      payment_installments: [
        ...prev.payment_installments,
        { amount: '', date: '', paid: false }
      ]
    }));
  };

  const updatePaymentInstallment = (index, field, value) => {
    setNewBudget(prev => ({
      ...prev,
      payment_installments: prev.payment_installments.map((installment, i) =>
        i === index ? { ...installment, [field]: value } : installment
      )
    }));
  };

  const removePaymentInstallment = (index) => {
    setNewBudget(prev => ({
      ...prev,
      payment_installments: prev.payment_installments.filter((_, i) => i !== index)
    }));
  };

  const getBudgetProgress = (budget) => {
    const target = budget.target_amount || 1;
    const saved = budget.current_saved || 0;
    const percentage = (saved / target) * 100;
    return {
      percentage: Math.min(percentage, 100),
      remaining: target - saved,
      saved: saved,
      target: target
    };
  };

  const getCategoryBudgets = (category) => {
    return Object.values(customBudgets).filter(budget => budget.category === category);
  };

  const getTotalByCategory = (category) => {
    const categoryBudgets = getCategoryBudgets(category);
    return categoryBudgets.reduce((total, budget) => total + (budget.target_amount || 0), 0);
  };

  const getSavedByCategory = (category) => {
    const categoryBudgets = getCategoryBudgets(category);
    return categoryBudgets.reduce((total, budget) => total + (budget.current_saved || 0), 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: text, margin: 0 }}>Presupuestos Personalizados</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <Plus size={18} /> Nuevo Presupuesto
        </button>
      </div>

      {/* Resumen por Categorías */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(BUDGET_CATEGORIES).map(([key, category]) => {
          const total = getTotalByCategory(key);
          const saved = getSavedByCategory(key);
          const progress = total > 0 ? (saved / total) * 100 : 0;
          
          return (
            <div key={key} style={{ 
              backgroundColor: card, 
              border: `1px solid ${border}`, 
              padding: '1.5rem', 
              borderRadius: '1rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                <div>
                  <h3 style={{ color: text, margin: 0 }}>{category.name}</h3>
                  <p style={{ color: textSec, fontSize: '0.875rem', margin: 0 }}>{category.description}</p>
                </div>
              </div>
              
              <div style={{ width: '100%', height: '8px', backgroundColor: border, borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  backgroundColor: category.color,
                  transition: 'width 0.3s' 
                }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: textSec }}>
                <span>${formatNumber(saved)} / ${formatNumber(total)}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista de Presupuestos por Categoría */}
      {Object.entries(BUDGET_CATEGORIES).map(([categoryKey, category]) => (
        <div key={categoryKey} style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: text, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {category.icon} {category.name}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {getCategoryBudgets(categoryKey).map(budget => {
              const progress = getBudgetProgress(budget);
              
              return (
                <div key={budget.id} style={{ 
                  backgroundColor: card, 
                  border: `1px solid ${border}`, 
                  padding: '1.5rem', 
                  borderRadius: '1rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ color: text, margin: '0 0 0.5rem 0' }}>{budget.name}</h3>
                      {budget.description && (
                        <p style={{ color: textSec, fontSize: '0.875rem', margin: 0 }}>{budget.description}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          setEditingBudget(budget);
                          setNewBudget({
                            ...budget,
                            payment_installments: budget.payment_installments || []
                          });
                          setShowCreateModal(true);
                        }}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: textSec
                        }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteBudget(budget.id)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: textSec
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{ width: '100%', height: '12px', backgroundColor: border, borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{ 
                      width: `${progress.percentage}%`, 
                      height: '100%', 
                      backgroundColor: category.color,
                      transition: 'width 0.3s' 
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: textSec }}>
                      ${formatNumber(progress.saved)} / ${formatNumber(progress.target)}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: progress.percentage >= 100 ? '#10b981' : category.color
                    }}>
                      {progress.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Cuotas de pago */}
                  {budget.payment_installments && budget.payment_installments.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: textSec, margin: '0 0 0.5rem 0' }}>Cuotas:</p>
                      {budget.payment_installments.map((installment, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.5rem',
                          backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
                          borderRadius: '0.25rem',
                          marginBottom: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          <span style={{ color: installment.paid ? '#10b981' : textSec }}>
                            {installment.date} - ${formatNumber(installment.amount)}
                          </span>
                          <span style={{ 
                            color: installment.paid ? '#10b981' : '#ef4444',
                            fontWeight: '600'
                          }}>
                            {installment.paid ? '✅ Pagado' : '⏳ Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

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
                      ¡Completado! 🎉
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {getCategoryBudgets(categoryKey).length === 0 && (
            <div style={{ 
              backgroundColor: card, 
              border: `1px solid ${border}`, 
              padding: '2rem', 
              borderRadius: '1rem',
              textAlign: 'center',
              color: textSec
            }}>
              <Target size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No hay presupuestos en esta categoría</p>
              <button 
                onClick={() => {
                  setNewBudget(prev => ({ ...prev, category: categoryKey }));
                  setShowCreateModal(true);
                }}
                style={{
                  backgroundColor: category.color,
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Crear primer presupuesto
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Modal para crear/editar presupuesto */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: card,
            border: `1px solid ${border}`,
            padding: '2rem',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: text, margin: '0 0 1.5rem 0' }}>
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: text, marginBottom: '0.5rem', fontWeight: '500' }}>
                  Categoría
                </label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${border}`,
                    borderRadius: '0.5rem',
                    backgroundColor: input,
                    color: text
                  }}
                >
                  {Object.entries(BUDGET_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: text, marginBottom: '0.5rem', fontWeight: '500' }}>
                  Nombre del Presupuesto
                </label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${border}`,
                    borderRadius: '0.5rem',
                    backgroundColor: input,
                    color: text
                  }}
                  placeholder="Ej: Ahorro para vacaciones"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: text, marginBottom: '0.5rem', fontWeight: '500' }}>
                  Descripción (Opcional)
                </label>
                <textarea
                  value={newBudget.description}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${border}`,
                    borderRadius: '0.5rem',
                    backgroundColor: input,
                    color: text,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Describe tu objetivo..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: text, marginBottom: '0.5rem', fontWeight: '500' }}>
                    Monto Objetivo
                  </label>
                  <input
                    type="number"
                    value={newBudget.target_amount}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, target_amount: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: input,
                      color: text
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: text, marginBottom: '0.5rem', fontWeight: '500' }}>
                    Monto Ahorrado
                  </label>
                  <input
                    type="number"
                    value={newBudget.current_saved}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, current_saved: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: input,
                      color: text
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Cuotas de pago */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ color: text, fontWeight: '500' }}>Cuotas de Pago</label>
                  <button
                    type="button"
                    onClick={addPaymentInstallment}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    + Agregar Cuota
                  </button>
                </div>
                
                {newBudget.payment_installments.map((installment, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Monto"
                      value={installment.amount}
                      onChange={(e) => updatePaymentInstallment(index, 'amount', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: `1px solid ${border}`,
                        borderRadius: '0.25rem',
                        backgroundColor: input,
                        color: text
                      }}
                    />
                    <input
                      type="date"
                      value={installment.date}
                      onChange={(e) => updatePaymentInstallment(index, 'date', e.target.value)}
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
                      type="button"
                      onClick={() => removePaymentInstallment(index)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleCreateBudget}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingBudget(null);
                  setNewBudget({
                    name: '',
                    category: 'fijo',
                    target_amount: '',
                    current_saved: '0',
                    payment_installments: [],
                    description: ''
                  });
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  color: textSec,
                  border: `1px solid ${border}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppBudgets;