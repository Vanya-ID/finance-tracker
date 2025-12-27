export interface SavingsItem {
  id: string
  name: string
  amount: number
  amountUsd: number
  percentage?: number
  isCustom: boolean
  icon?: string
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

export interface DistributionRule {
  id: string
  name: string
  percentage: number
  savingsItemIds: string[]
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

export interface ActualFinancialData {
  incomes: Array<{ id: string; name: string; amount: number }>
  expenses: Array<{ id: string; name: string; amount: number }>
  savings: Array<{ id: string; name: string; amount: number }>
  tax: number
  mandatoryExpenses: number
  totalIncome?: number  // Если введен только итог
  totalExpenses?: number
  totalSavings?: number
}

export interface MonthlyReport {
  id: string
  year: number
  month: number  // 1-12
  plan: FinancialData  // Снимок плана на момент создания
  actual?: ActualFinancialData  // Фактические данные
  createdAt: number
}

export interface SavingsTransaction {
  id: string
  savingsId: string  // ID копилки
  amount: number  // Сумма (положительная для пополнения, отрицательная для вычета)
  year: number
  month: number  // 1-12
  type: 'deposit' | 'withdrawal'  // Тип операции
  createdAt: number  // Время создания транзакции
  description?: string  // Описание (необязательно)
}

export interface SavingsStats {
  savingsId: string
  savingsName: string
  icon?: string
  totalDeposited: number  // Всего отложено
  totalWithdrawn: number  // Всего вычтено
  currentBalance: number  // Текущий баланс (deposited - withdrawn)
}

