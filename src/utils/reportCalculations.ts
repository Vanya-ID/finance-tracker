import { FinancialData, ActualFinancialData } from '../types'

export const calculateTotalIncome = (data: FinancialData): number => {
  return data.incomes.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTotalExpenses = (data: FinancialData): number => {
  return data.expenses.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTotalSavings = (data: FinancialData): number => {
  return data.savings.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateActualTotalIncome = (actual: ActualFinancialData): number => {
  if (actual.totalIncome !== undefined) {
    return actual.totalIncome
  }
  return actual.incomes.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateActualTotalExpenses = (actual: ActualFinancialData): number => {
  if (actual.totalExpenses !== undefined) {
    return actual.totalExpenses
  }
  return actual.expenses.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateActualTotalSavings = (actual: ActualFinancialData): number => {
  if (actual.totalSavings !== undefined) {
    return actual.totalSavings
  }
  return actual.savings.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateDeviation = (planned: number, actual: number): number => {
  if (planned === 0) return 0
  return ((actual - planned) / planned) * 100
}

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return (value / total) * 100
}

