export interface SavingsItem {
  id: string
  name: string
  amount: number
  amountUsd: number
  percentage?: number
  isCustom: boolean
  icon?: string
  isGroup?: boolean  // Флаг, определяющий, является ли элемент группой
  parentId?: string  // ID родительской группы (для дочерних копилок)
}

export interface IncomeItem {
  id: string
  name: string
  amount: number
  icon?: string
}

export interface ExpenseItem {
  id: string
  name: string
  amount: number
  icon?: string
}

export interface FinancialData {
  incomes: IncomeItem[]
  exchangeRate: number
  savings: SavingsItem[]
  expenses: ExpenseItem[]
  tax: number
  mandatoryExpenses: number
}

export interface UserProfile {
  firstName: string
  lastName: string
}
