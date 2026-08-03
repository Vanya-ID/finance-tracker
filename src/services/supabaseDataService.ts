import { FinancialData, UserProfile } from '../types'
import { STORAGE_KEYS, readStorage, writeStorage } from './localStore'

export type Settings = {
  selectedPresetType?: '50-30-20' | '50-40-10' | 'custom'
  mandatoryExpensesPercentage?: number
  customPercentages?: { mandatory: number; savings: number; remainder: number }
  rulesEnabled?: boolean
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

export const saveSettings = async (settings: Settings): Promise<void> => {
  const existingSettings = readStorage<Settings>(STORAGE_KEYS.settings, {})
  writeStorage(STORAGE_KEYS.settings, { ...existingSettings, ...settings })
}

export const loadSettings = async (): Promise<Settings | null> => {
  return readStorage<Settings | null>(STORAGE_KEYS.settings, null)
}
