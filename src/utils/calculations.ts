import { SavingsItem, DistributionRule, ExpenseItem, IncomeItem } from '../types'

export const calculateAfterSavings = (income: number, totalSavings: number): number => {
  return income - totalSavings
}

export const calculateSavingsTotal = (savings: SavingsItem[]): number => {
  return savings.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateExpensesTotal = (expenses: ExpenseItem[]): number => {
  return expenses.reduce((sum, item) => sum + item.amount, 0)
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

export const applyDistributionRules = (
  savings: SavingsItem[],
  rules: DistributionRule[],
  totalIncome: number
): SavingsItem[] => {
  return savings.map((item) => {
    // Находим правило, которое относится к этой копилке
    const rule = rules.find((r) => r.savingsItemIds.includes(item.id))
    
    // Применяем правило только если оно найдено и копилка не помечена как кастомная
    if (rule) {
      // Если копилка помечена как кастомная, правило не применяем
      if (item.isCustom) {
        return item
      }
      
      // Проценты применяются к доходу (правило 50/30/20: 50% обязательные, 30% и 20% от дохода на копилки)
      const calculatedAmount = Math.round((totalIncome * rule.percentage) / 100)
      
      return {
        ...item,
        amount: calculatedAmount,
        percentage: rule.percentage,
      }
    }
    
    // Если правило не найдено, возвращаем копилку без изменений
    return item
  })
}

export const calculateUsdAmount = (amountRub: number, exchangeRate: number): number => {
  return exchangeRate > 0 ? amountRub / exchangeRate : 0
}

