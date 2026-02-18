import { useState, useRef, useEffect, useCallback } from 'react'
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
  createTransaction as createTransactionInDB,
  loadTransactions as loadTransactionsFromDB,
  updateTransaction as updateTransactionInDB,
  deleteTransaction as deleteTransactionFromDB,
} from '../services/supabaseDataService'
import { FinancialData, UserProfile, MonthlyReport, SavingsTransaction, DistributionRule, Transaction } from '../types'

type Settings = {
  selectedPresetType?: '50-30-20' | '50-40-10' | 'custom'
  mandatoryExpensesPercentage?: number
  exchangeRate?: number
  distributionRules?: DistributionRule[]
  customPercentages?: { mandatory: number; savings: number; remainder: number }
  selectedSavingsForStats?: string[]
}

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

  // Немедленное сохранение настроек
  const saveSettingsImmediate = useCallback(async (settings: Settings): Promise<void> => {
    // Ручные операции всегда сохраняются
    try {
      await saveSettingsToDB(settings)
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error)
      throw error
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

  // Сохранение отчета
  const saveReport = useCallback(async (report: MonthlyReport): Promise<void> => {
    try {
      await saveReportToDB(report)
    } catch (error) {
      console.error('Ошибка сохранения отчета:', error)
      throw error
    }
  }, [])

  // Загрузка всех отчетов
  const loadAllReports = useCallback(async (): Promise<MonthlyReport[]> => {
    try {
      const reports = await loadAllReportsFromDB()
      return reports
    } catch (error) {
      console.error('Ошибка загрузки отчетов:', error)
      throw error
    }
  }, [])

  // Сохранение вычетов из копилок
  const saveSavingsWithdrawals = useCallback(async (withdrawals: SavingsTransaction[]): Promise<void> => {
    try {
      await saveSavingsWithdrawalsToDB(withdrawals)
    } catch (error) {
      console.error('Ошибка сохранения вычетов из копилок:', error)
      throw error
    }
  }, [])

  // Загрузка вычетов из копилок
  const loadSavingsWithdrawals = useCallback(async (): Promise<SavingsTransaction[]> => {
    try {
      const withdrawals = await loadSavingsWithdrawalsFromDB()
      return withdrawals
    } catch (error) {
      console.error('Ошибка загрузки вычетов из копилок:', error)
      throw error
    }
  }, [])

  // Транзакции
  const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<Transaction | null> => {
    try {
      const result = await createTransactionInDB(transaction)
      return result
    } catch (error) {
      console.error('Ошибка создания транзакции:', error)
      throw error
    }
  }, [])

  const loadTransactions = useCallback(async (fromDate?: number, toDate?: number): Promise<Transaction[]> => {
    try {
      const result = await loadTransactionsFromDB(fromDate, toDate)
      return result
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error)
      throw error
    }
  }, [])

  const updateTransaction = useCallback(async (transaction: Transaction): Promise<void> => {
    try {
      await updateTransactionInDB(transaction)
    } catch (error) {
      console.error('Ошибка обновления транзакции:', error)
      throw error
    }
  }, [])

  const deleteTransaction = useCallback(async (transactionId: string): Promise<void> => {
    try {
      await deleteTransactionFromDB(transactionId)
    } catch (error) {
      console.error('Ошибка удаления транзакции:', error)
      throw error
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
    saveSettingsImmediate,
    saveSettingsDebounced,
    loadSettings,
    saveProfileDebounced,
    loadProfile,
    saveReport,
    loadAllReports,
    saveSavingsWithdrawals,
    loadSavingsWithdrawals,
    createTransaction,
    loadTransactions,
    updateTransaction,
    deleteTransaction,
  }
}

