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
      lastQuoteDate: null,
      
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
        try {
          if (typeof window === 'undefined') return;

          const { data, error } = await supabase
            .from('daily_quotes')
            .select('*');
          
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            // Seleccionar una frase aleatoria
            const randomIndex = Math.floor(Math.random() * data.length);
            const selectedQuote = data[randomIndex];
            set({ currentQuote: selectedQuote });
            return selectedQuote;
          } else {
            // Si no hay frases en la base de datos, usar frases por defecto
            const defaultQuotes = [
              {
                quote: "El arte de la guerra se basa en el engaño.",
                author: "Sun Tzu"
              },
              {
                quote: "La paciencia es amarga, pero su fruto es dulce.",
                author: "Jean-Jacques Rousseau"
              },
              {
                quote: "El único verdadero viaje de descubrimiento consiste no en buscar nuevos paisajes, sino en mirar con nuevos ojos.",
                author: "Marcel Proust"
              },
              {
                quote: "La vida es lo que pasa mientras estás ocupado haciendo otros planes.",
                author: "John Lennon"
              },
              {
                quote: "No cuentes los días, haz que los días cuenten.",
                author: "Muhammad Ali"
              }
            ];
            
            const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
            const defaultQuote = defaultQuotes[randomIndex];
            set({ currentQuote: defaultQuote });
            return defaultQuote;
          }
        } catch (error) {
          console.error('Error loading quote:', error);
          // En caso de error, usar una frase por defecto
          const fallbackQuote = {
            quote: "La perseverancia es el camino al éxito.",
            author: "Anónimo"
          };
          set({ currentQuote: fallbackQuote });
          return fallbackQuote;
        }
      },

      // Nueva función: Cargar frase solo una vez al día
      loadDailyQuote: async () => {
        try {
          if (typeof window === 'undefined') return;
          
          const state = get();
          const today = new Date().toDateString();
          
          // Si ya tenemos una frase de hoy, no cargar nueva
          if (state.lastQuoteDate === today && state.currentQuote) {
            return state.currentQuote;
          }
          
          // Cargar nueva frase
          const quote = await state.loadRandomQuote();
          set({ lastQuoteDate: today });
          return quote;
        } catch (error) {
          console.error('Error loading daily quote:', error);
          return null;
        }
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
      },

      // Función auxiliar para obtener configuraciones específicas
      getSetting: (key) => {
        const { settings } = get();
        return settings[key];
      },

      // Función para resetear configuraciones a valores por defecto
      resetSettings: async () => {
        try {
          if (typeof window === 'undefined') return false;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          
          const defaultSettings = {
            app_name: 'FamControl v2',
            currency: 'COP',
            thousands_separator: true,
            color_primary: '#1976d2',
            color_secondary: '#424242',
            color_accent: '#82B1FF'
          };
          
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              ...defaultSettings,
              updated_at: new Date().toISOString()
            });
          
          if (!error) {
            set({ settings: defaultSettings });
            get().applyThemeColors(defaultSettings);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error resetting settings:', error);
          return false;
        }
      }
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        currentQuote: state.currentQuote,
        lastQuoteDate: state.lastQuoteDate
      }),
      // Configuración para evitar errores en SSR
      skipHydration: false,
      version: 1,
      migrate: (persistedState, version) => {
        // Migración de versiones futuras si es necesario
        if (version === 0) {
          // Ejemplo: migrar desde versión 0 a 1
        }
        return persistedState;
      }
    }
  )
);