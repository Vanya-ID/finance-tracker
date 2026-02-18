import { FinancialData, MonthlyReport, UserProfile, SavingsTransaction, DistributionRule, Transaction } from '../types'

type Settings = {
  selectedPresetType?: '50-30-20' | '50-40-10' | 'custom'
  mandatoryExpensesPercentage?: number
  exchangeRate?: number
  distributionRules?: DistributionRule[]
  customPercentages?: { mandatory: number; savings: number; remainder: number }
  selectedSavingsForStats?: string[]
}

const STORAGE_KEYS = {
  financialData: 'finance-tracker-financial-data',
  profile: 'finance-tracker-profile',
  settings: 'finance-tracker-settings',
  reports: 'finance-tracker-reports',
  savingsWithdrawals: 'finance-tracker-savings-withdrawals',
  transactions: 'finance-tracker-transactions',
} as const

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

const readStorage = <T>(key: string, fallback: T): T => {
  const storage = getStorage()
  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch (error) {
    console.error(`Ошибка чтения localStorage по ключу "${key}":`, error)
    return fallback
  }
}

const writeStorage = <T>(key: string, value: T): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Ошибка записи localStorage по ключу "${key}":`, error)
    throw error
  }
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const saveFinancialData = async (data: FinancialData): Promise<void> => {
  writeStorage(STORAGE_KEYS.financialData, data)
}

export const loadFinancialData = async (): Promise<FinancialData | null> => {
  return readStorage<FinancialData | null>(STORAGE_KEYS.financialData, null)
}

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  writeStorage(STORAGE_KEYS.profile, profile)
}

export const loadProfile = async (): Promise<UserProfile | null> => {
  return readStorage<UserProfile | null>(STORAGE_KEYS.profile, null)
}

export const saveReport = async (report: MonthlyReport): Promise<void> => {
  const reports = readStorage<MonthlyReport[]>(STORAGE_KEYS.reports, [])
  const reportId = report.id || generateId()
  const createdAt = typeof report.createdAt === 'number' ? report.createdAt : Date.now()
  const normalizedReport: MonthlyReport = {
    ...report,
    id: reportId,
    createdAt,
  }

  const existingIndex = reports.findIndex((item) => item.year === report.year && item.month === report.month)
  if (existingIndex >= 0) {
    reports[existingIndex] = normalizedReport
  } else {
    reports.push(normalizedReport)
  }

  writeStorage(STORAGE_KEYS.reports, reports)
}

export const loadAllReports = async (): Promise<MonthlyReport[]> => {
  const reports = readStorage<MonthlyReport[]>(STORAGE_KEYS.reports, [])
  return reports.sort((a, b) => (b.year - a.year) || (b.month - a.month))
}

export const deleteReport = async (year: number, month: number): Promise<void> => {
  const reports = readStorage<MonthlyReport[]>(STORAGE_KEYS.reports, [])
  const filteredReports = reports.filter((item) => item.year !== year || item.month !== month)
  writeStorage(STORAGE_KEYS.reports, filteredReports)
}

export const saveSettings = async (settings: Settings): Promise<void> => {
  const existingSettings = readStorage<Settings>(STORAGE_KEYS.settings, {})
  const mergedSettings: Settings = { ...existingSettings, ...settings }
  writeStorage(STORAGE_KEYS.settings, mergedSettings)
}

export const loadSettings = async (): Promise<Settings | null> => {
  return readStorage<Settings | null>(STORAGE_KEYS.settings, null)
}

export const saveSavingsWithdrawals = async (withdrawals: SavingsTransaction[]): Promise<void> => {
  writeStorage(STORAGE_KEYS.savingsWithdrawals, withdrawals)
}

export const loadSavingsWithdrawals = async (): Promise<SavingsTransaction[]> => {
  return readStorage<SavingsTransaction[]>(STORAGE_KEYS.savingsWithdrawals, [])
}

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<Transaction> => {
  const transactions = readStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const now = Date.now()
  const createdTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    userId: 'local',
    createdAt: now,
    updatedAt: now,
  }

  writeStorage(STORAGE_KEYS.transactions, [createdTransaction, ...transactions])
  return createdTransaction
}

export const loadTransactions = async (fromDate?: number, toDate?: number): Promise<Transaction[]> => {
  const transactions = readStorage<Transaction[]>(STORAGE_KEYS.transactions, [])

  const filteredTransactions = transactions.filter((transaction) => {
    if (fromDate !== undefined && transaction.date < fromDate) {
      return false
    }
    if (toDate !== undefined && transaction.date > toDate) {
      return false
    }
    return true
  })

  return filteredTransactions.sort((a, b) => (b.date - a.date) || (b.createdAt - a.createdAt))
}

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
  const transactions = readStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const updatedTransactions = transactions.map((item) => {
    if (item.id !== transaction.id) {
      return item
    }

    return {
      ...transaction,
      updatedAt: Date.now(),
    }
  })

  writeStorage(STORAGE_KEYS.transactions, updatedTransactions)
}

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  const transactions = readStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const filteredTransactions = transactions.filter((item) => item.id !== transactionId)
  writeStorage(STORAGE_KEYS.transactions, filteredTransactions)
}

