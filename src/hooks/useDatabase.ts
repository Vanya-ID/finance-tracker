import { useState, useRef, useEffect, useCallback } from 'react'
import {
  saveFinancialData as saveFinancialDataToDB,
  loadFinancialData as loadFinancialDataFromDB,
  saveSettings as saveSettingsToDB,
  loadSettings as loadSettingsFromDB,
  saveProfile as saveProfileToDB,
  loadProfile as loadProfileFromDB,
} from '../services/supabaseDataService'
import { Settings } from '../services/supabaseDataService'
import { FinancialData, UserProfile } from '../types'

export const useDatabase = () => {
  // Состояния загрузки/сохранения
  const [saving, setSaving] = useState(false)

  // Refs для пропуска сохранения после загрузки
  const skipFinancialSaveRef = useRef(false)
  const skipSettingsSaveRef = useRef(false)
  const skipProfileSaveRef = useRef(false)

  // Debounce таймеры
  const financialSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const settingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const profileSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Немедленное сохранение финансовых данных (для add/remove операций)
  const saveFinancialDataImmediate = useCallback(async (data: FinancialData): Promise<void> => {
    // Ручные операции всегда сохраняются, независимо от skipFinancialSaveRef
    try {
      setSaving(true)
      await saveFinancialDataToDB(data)
    } catch (error) {
      console.error('Ошибка сохранения финансовых данных:', error)
      throw error
    } finally {
      // Используем setTimeout, чтобы гарантировать сброс состояния
      setTimeout(() => {
        setSaving(false)
      }, 100)
    }
  }, [])

  // Debounced сохранение финансовых данных (для update операций)
  const saveFinancialDataDebounced = useCallback((data: FinancialData): void => {
    // Пропускаем сохранение сразу после загрузки данных
    if (skipFinancialSaveRef.current) {
      skipFinancialSaveRef.current = false
      return
    }

    // Очищаем предыдущий таймер
    if (financialSaveTimeoutRef.current) {
      clearTimeout(financialSaveTimeoutRef.current)
    }

    // Устанавливаем новый таймер
    financialSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        await saveFinancialDataToDB(data)
      } catch (error) {
        console.error('Ошибка сохранения финансовых данных:', error)
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [])

  // Загрузка финансовых данных
  const loadFinancialData = useCallback(async (): Promise<FinancialData | null> => {
    skipFinancialSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const data = await loadFinancialDataFromDB()
      return data
    } catch (error) {
      console.error('Ошибка загрузки финансовых данных:', error)
      throw error
    } finally {
      // Сбрасываем флаг после небольшой задержки, чтобы дать время на обновление состояния
      setTimeout(() => {
        skipFinancialSaveRef.current = false
      }, 100)
    }
  }, [])

  // Debounced сохранение настроек
  const saveSettingsDebounced = useCallback((settings: Settings): void => {
    // Пропускаем сохранение сразу после загрузки настроек
    if (skipSettingsSaveRef.current) {
      skipSettingsSaveRef.current = false
      return
    }

    // Очищаем предыдущий таймер
    if (settingsSaveTimeoutRef.current) {
      clearTimeout(settingsSaveTimeoutRef.current)
    }

    // Устанавливаем новый таймер
    settingsSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveSettingsToDB(settings)
      } catch (error) {
        console.error('Ошибка сохранения настроек:', error)
      }
    }, 500)
  }, [])

  // Загрузка настроек
  const loadSettings = useCallback(async (): Promise<Settings | null> => {
    skipSettingsSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const settings = await loadSettingsFromDB()
      return settings
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
      throw error
    } finally {
      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        skipSettingsSaveRef.current = false
      }, 100)
    }
  }, [])

  // Debounced сохранение профиля
  const saveProfileDebounced = useCallback((profile: UserProfile): void => {
    // Пропускаем сохранение сразу после загрузки профиля
    if (skipProfileSaveRef.current) {
      skipProfileSaveRef.current = false
      return
    }

    // Очищаем предыдущий таймер
    if (profileSaveTimeoutRef.current) {
      clearTimeout(profileSaveTimeoutRef.current)
    }

    // Устанавливаем новый таймер
    profileSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveProfileToDB(profile)
      } catch (error) {
        console.error('Ошибка сохранения профиля:', error)
      }
    }, 500)
  }, [])

  // Загрузка профиля
  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    skipProfileSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const profile = await loadProfileFromDB()
      return profile
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      throw error
    } finally {
      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        skipProfileSaveRef.current = false
      }, 100)
    }
  }, [])

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (financialSaveTimeoutRef.current) {
        clearTimeout(financialSaveTimeoutRef.current)
      }
      if (settingsSaveTimeoutRef.current) {
        clearTimeout(settingsSaveTimeoutRef.current)
      }
      if (profileSaveTimeoutRef.current) {
        clearTimeout(profileSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saving,
    saveFinancialDataImmediate,
    saveFinancialDataDebounced,
    loadFinancialData,
    saveSettingsDebounced,
    loadSettings,
    saveProfileDebounced,
    loadProfile,
  }
}
