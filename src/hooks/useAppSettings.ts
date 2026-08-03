import { useCallback, useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../services/supabaseDataService'

export const useAppSettings = () => {
  const [rulesEnabled, setRulesEnabledState] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    loadSettings()
      .then((settings) => {
        if (mounted && settings?.rulesEnabled !== undefined) {
          setRulesEnabledState(settings.rulesEnabled)
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки настроек:', error)
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const setRulesEnabled = useCallback(async (enabled: boolean) => {
    setRulesEnabledState(enabled)
    await saveSettings({ rulesEnabled: enabled })
  }, [])

  return {
    rulesEnabled,
    setRulesEnabled,
    loading,
  }
}
