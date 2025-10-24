import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    app_name: 'FamControl v2',
    currency: 'COP',
    thousands_separator: true,
    color_primary: '#1976d2',
    color_secondary: '#424242',
    color_accent: '#82B1FF'
  })

  const currentQuote = ref(null)

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        settings.value = { ...settings.value, ...data }
        applyThemeColors(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  async function saveSettings(newSettings) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        })

      if (!error) {
        settings.value = { ...settings.value, ...newSettings }
        applyThemeColors(newSettings)
        return true
      }
      return false
    } catch (error) {
      console.error('Error saving settings:', error)
      return false
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'No user logged in' }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        return { success: false, error: 'Contraseña actual incorrecta' }
      }

      // Cambiar contraseña
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function loadRandomQuote() {
    try {
      const { data, error } = await supabase
        .from('daily_quotes')
        .select('*')
        .limit(1)
        .order('random()')

      if (data && data.length > 0) {
        currentQuote.value = data[0]
      }
    } catch (error) {
      console.error('Error loading quote:', error)
    }
  }

  function applyThemeColors(settings) {
    if (settings.color_primary) {
      document.documentElement.style.setProperty('--primary', settings.color_primary)
    }
    if (settings.color_secondary) {
      document.documentElement.style.setProperty('--secondary', settings.color_secondary)
    }
    if (settings.color_accent) {
      document.documentElement.style.setProperty('--accent', settings.color_accent)
    }
  }

  function formatCurrency(amount) {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    const options = {
      style: 'currency',
      currency: settings.value.currency,
      useGrouping: settings.value.thousands_separator
    }
    
    return new Intl.NumberFormat('es-CO', options).format(numericAmount)
  }

  return {
    settings,
    currentQuote,
    loadSettings,
    saveSettings,
    changePassword,
    loadRandomQuote,
    formatCurrency
  }
})