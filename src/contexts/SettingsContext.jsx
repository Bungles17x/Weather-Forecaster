import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    units: 'imperial',
    theme: 'neon-storm',
    accentColor: '#6ee7f9',
    fontScale: 'normal',
    density: 'comfortable',
    motion: true,
    notifications: true,
    autoRefresh: true,
    refreshInterval: 10,
    location: 'auto',
    language: 'en'
  })

  const [loading, setLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('weatherSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('weatherSettings', JSON.stringify(settings))
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    }
  }, [settings, loading])

  // Apply theme packs as root classes so theme changes remain a token-only swap.
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const themeClasses = ['dark-theme', 'light-theme', 'theme-neon-storm', 'theme-aurora', 'theme-sunset', 'theme-midnight-oled', 'theme-paper', 'theme-high-contrast']
    const applyTheme = () => {
      const hour = new Date().getHours()
      let theme = settings.theme || 'neon-storm'
      if (theme === 'auto') theme = media.matches ? 'neon-storm' : 'paper'
      if (theme === 'auto-sky') theme = hour >= 6 && hour < 17 ? 'aurora' : hour >= 17 && hour < 20 ? 'sunset' : 'midnight-oled'
      root.classList.remove(...themeClasses)
      root.classList.add(`theme-${theme}`)
      root.classList.toggle('dark-theme', !['paper'].includes(theme))
      root.classList.toggle('light-theme', theme === 'paper')
      root.dataset.density = settings.density || 'comfortable'
      root.dataset.fontScale = settings.fontScale || 'normal'
      root.dataset.motion = settings.motion === false ? 'off' : 'on'
      root.style.setProperty('--accent-user', settings.accentColor || '#6ee7f9')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'paper' ? '#f4f7fb' : theme === 'midnight-oled' ? '#000000' : '#07101c')
    }
    applyTheme()
    if (settings.theme === 'auto') media.addEventListener?.('change', applyTheme)
    const onVisibility = () => { if (!document.hidden && settings.theme === 'auto-sky') applyTheme() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      media.removeEventListener?.('change', applyTheme)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [settings.theme, settings.accentColor, settings.fontScale, settings.density, settings.motion])

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateMultipleSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const resetSettings = () => {
    const defaultSettings = {
      units: 'imperial',
      theme: 'neon-storm',
      accentColor: '#6ee7f9',
      fontScale: 'normal',
      density: 'comfortable',
      motion: true,
      notifications: true,
      autoRefresh: true,
      refreshInterval: 10,
      location: 'auto',
      language: 'en'
    }
    setSettings(defaultSettings)
  }

  const value = {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
