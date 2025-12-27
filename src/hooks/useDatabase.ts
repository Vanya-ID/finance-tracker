import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  saveFinancialData as saveFinancialDataToDB,
  loadFinancialData as loadFinancialDataFromDB,
  saveSettings as saveSettingsToDB,
  loadSettings as loadSettingsFromDB,
  saveProfile as saveProfileToDB,
  loadProfile as loadProfileFromDB,
  saveReport as saveReportToDB,
  loadAllReports as loadAllReportsFromDB,
  saveSavingsWithdrawals as saveSavingsWithdrawalsToDB,
  loadSavingsWithdrawals as loadSavingsWithdrawalsFromDB,
} from '../services/supabaseDataService'
import { FinancialData, UserProfile, MonthlyReport, SavingsTransaction, DistributionRule } from '../types'

type Settings = {
  selectedPresetType?: '50-30-20' | '50-40-10' | 'custom'
  mandatoryExpensesPercentage?: number
  exchangeRate?: number
  distributionRules?: DistributionRule[]
  customPercentages?: { mandatory: number; savings: number; remainder: number }
  selectedSavingsForStats?: string[]
}

export const useDatabase = () => {
  const { user, isAuthenticated } = useAuth()
  
  // Состояния загрузки/сохранения
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
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
    if (!isAuthenticated || !user) {
      return
    }
    
    // Ручные операции всегда сохраняются, независимо от skipFinancialSaveRef
    try {
      setSaving(true)
      await saveFinancialDataToDB(user.id, data)
    } catch (error) {
      console.error('Ошибка сохранения финансовых данных:', error)
      throw error
    } finally {
      // Используем setTimeout, чтобы гарантировать сброс состояния
      setTimeout(() => {
        setSaving(false)
      }, 100)
    }
  }, [isAuthenticated, user])

  // Debounced сохранение финансовых данных (для update операций)
  const saveFinancialDataDebounced = useCallback((data: FinancialData): void => {
    if (!isAuthenticated || !user) {
      return
    }
    
    // Пропускаем сохранение сразу после загрузки данных из Firebase
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
        await saveFinancialDataToDB(user.id, data)
      } catch (error) {
        console.error('Ошибка сохранения финансовых данных:', error)
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [isAuthenticated, user])

  // Загрузка финансовых данных
  const loadFinancialData = useCallback(async (): Promise<FinancialData | null> => {
    if (!isAuthenticated || !user) {
      return null
    }
    
    skipFinancialSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const data = await loadFinancialDataFromDB(user.id)
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
  }, [isAuthenticated, user])

  // Немедленное сохранение настроек
  const saveSettingsImmediate = useCallback(async (settings: Settings): Promise<void> => {
    if (!isAuthenticated || !user) {
      return
    }
    
    // Ручные операции всегда сохраняются
    try {
      await saveSettingsToDB(user.id, settings)
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error)
      throw error
    }
  }, [isAuthenticated, user])

  // Debounced сохранение настроек
  const saveSettingsDebounced = useCallback((settings: Settings): void => {
    if (!isAuthenticated || !user) {
      return
    }
    
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
        await saveSettingsToDB(user.id, settings)
      } catch (error) {
        console.error('Ошибка сохранения настроек:', error)
      }
    }, 500)
  }, [isAuthenticated, user])

  // Загрузка настроек
  const loadSettings = useCallback(async (): Promise<Settings | null> => {
    if (!isAuthenticated || !user) {
      return null
    }
    
    skipSettingsSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const settings = await loadSettingsFromDB(user.id)
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
  }, [isAuthenticated, user])

  // Debounced сохранение профиля
  const saveProfileDebounced = useCallback((profile: UserProfile): void => {
    if (!isAuthenticated || !user) {
      return
    }
    
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
        await saveProfileToDB(user.id, profile)
      } catch (error) {
        console.error('Ошибка сохранения профиля:', error)
      }
    }, 500)
  }, [isAuthenticated, user])

  // Загрузка профиля
  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!isAuthenticated || !user) {
      return null
    }
    
    skipProfileSaveRef.current = true // Пропускаем сохранение после загрузки
    try {
      const profile = await loadProfileFromDB(user.id)
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
  }, [isAuthenticated, user])

  // Сохранение отчета
  const saveReport = useCallback(async (report: MonthlyReport): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('Не авторизован для сохранения отчета')
    }
    
    try {
      await saveReportToDB(user.id, report)
    } catch (error) {
      console.error('Ошибка сохранения отчета:', error)
      throw error
    }
  }, [isAuthenticated, user])

  // Загрузка всех отчетов
  const loadAllReports = useCallback(async (): Promise<MonthlyReport[]> => {
    if (!isAuthenticated || !user) {
      return []
    }
    
    try {
      const reports = await loadAllReportsFromDB(user.id)
      return reports
    } catch (error) {
      console.error('Ошибка загрузки отчетов:', error)
      throw error
    }
  }, [isAuthenticated, user])

  // Сохранение вычетов из копилок
  const saveSavingsWithdrawals = useCallback(async (withdrawals: SavingsTransaction[]): Promise<void> => {
    if (!isAuthenticated || !user) {
      return
    }
    
    try {
      await saveSavingsWithdrawalsToDB(user.id, withdrawals)
    } catch (error) {
      console.error('Ошибка сохранения вычетов из копилок:', error)
      throw error
    }
  }, [isAuthenticated, user])

  // Загрузка вычетов из копилок
  const loadSavingsWithdrawals = useCallback(async (): Promise<SavingsTransaction[]> => {
    if (!isAuthenticated || !user) {
      return []
    }
    
    try {
      const withdrawals = await loadSavingsWithdrawalsFromDB(user.id)
      return withdrawals
    } catch (error) {
      console.error('Ошибка загрузки вычетов из копилок:', error)
      throw error
    }
  }, [isAuthenticated, user])

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
    loading,
    saveFinancialDataImmediate,
    saveFinancialDataDebounced,
    loadFinancialData,
    saveSettingsImmediate,
    saveSettingsDebounced,
    loadSettings,
    saveProfileDebounced,
    loadProfile,
    saveReport,
    loadAllReports,
    saveSavingsWithdrawals,
    loadSavingsWithdrawals,
  }
}

