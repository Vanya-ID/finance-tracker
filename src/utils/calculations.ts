import { ExpenseItem, IncomeItem, SavingsItem } from '../types'

export const calculateSavingsTotal = (savings: SavingsItem[]): number => {
  return savings.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateExpensesTotal = (expenses: ExpenseItem[]): number => {
  return expenses.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateUsdAmount = (amountRub: number, exchangeRate: number): number => {
  return exchangeRate > 0 ? amountRub / exchangeRate : 0
}

export const calculateIncomeTotal = (incomes: IncomeItem[]): number => {
  return incomes.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateBalance = (
  income: number,
  savings: number,
  expenses: number,
  tax: number,
  mandatoryExpenses: number
): number => {
  return income - savings - expenses - tax - mandatoryExpenses
}
