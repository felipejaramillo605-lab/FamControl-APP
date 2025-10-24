// stores/settings.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabaseClient';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      settings: {
        app_name: 'FamControl v2',
        currency: 'COP',
        thousands_separator: true,
        color_primary: '#1976d2',
        color_secondary: '#424242',
        color_accent: '#82B1FF'
      },
      currentQuote: null,
      
      // Acciones
      loadSettings: async () => {
        try {
          // Solo ejecutar en el navegador (cliente)
          if (typeof window === 'undefined') return;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (data && !error) {
            set({ settings: { ...get().settings, ...data } });
            get().applyThemeColors(data);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      },
      
      updateSettings: async (newSettings) => {
        try {
          if (typeof window === 'undefined') return false;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              ...newSettings,
              updated_at: new Date().toISOString()
            });
          
          if (!error) {
            set({ settings: { ...get().settings, ...newSettings } });
            get().applyThemeColors(newSettings);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error saving settings:', error);
          return false;
        }
      },
      
      changePassword: async (currentPassword, newPassword) => {
        try {
          if (typeof window === 'undefined') return { success: false, error: 'No browser environment' };
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { success: false, error: 'No user logged in' };
          
          // Verificar contraseña actual
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
          });
          
          if (signInError) {
            return { success: false, error: 'Contraseña actual incorrecta' };
          }
          
          // Cambiar contraseña
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          return { success: !error, error: error?.message };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      loadRandomQuote: async () => {
        return new Promise(async (resolve, reject) => {
          try {
            if (typeof window === 'undefined') {
              resolve();
              return;
            }
            
            const { data, error } = await supabase
              .from('daily_quotes')
              .select('*');
            
            if (error) {
              reject(error);
              return;
            }
            
            if (data && data.length > 0) {
              // Seleccionar una frase aleatoria
              const randomIndex = Math.floor(Math.random() * data.length);
              set({ currentQuote: data[randomIndex] });
              resolve(data[randomIndex]);
            } else {
              resolve();
            }
          } catch (error) {
            console.error('Error loading quote:', error);
            reject(error);
          }
        });
      },
      
      applyThemeColors: (settings) => {
        // Solo en navegador
        if (typeof window === 'undefined') return;
        
        if (settings.color_primary) {
          document.documentElement.style.setProperty('--primary', settings.color_primary);
        }
        if (settings.color_secondary) {
          document.documentElement.style.setProperty('--secondary', settings.color_secondary);
        }
        if (settings.color_accent) {
          document.documentElement.style.setProperty('--accent', settings.color_accent);
        }
      },
      
      formatCurrency: (amount) => {
        const { settings } = get();
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        if (isNaN(numericAmount)) return '$0';
        
        if (settings.thousands_separator) {
          return `$${numericAmount.toLocaleString('es-CO')}`;
        } else {
          return `$${numericAmount}`;
        }
      }
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ settings: state.settings }),
      // Configuración para evitar errores en SSR
      skipHydration: false,
      version: 1
    }
  )
);