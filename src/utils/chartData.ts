import { FinancialData, ActualFinancialData } from '../types'
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalSavings,
  calculateActualTotalIncome,
  calculateActualTotalExpenses,
  calculateActualTotalSavings,
  calculatePercentage,
} from './reportCalculations'

export interface ChartDataPoint {
  name: string
  value: number
  percentage?: number
}

export interface ComparisonDataPoint {
  name: string
  plan: number
  actual: number
  deviation?: number
}

export const prepareDistributionData = (
  plan: FinancialData,
  actual?: ActualFinancialData
): {
  planData: ChartDataPoint[]
  actualData?: ChartDataPoint[]
} => {
  const planIncome = calculateTotalIncome(plan)
  const planExpenses = calculateTotalExpenses(plan)
  const planSavings = calculateTotalSavings(plan)

  const planData: ChartDataPoint[] = [
    {
      name: 'Расходы',
      value: planExpenses + plan.mandatoryExpenses,
      percentage: calculatePercentage(planExpenses + plan.mandatoryExpenses, planIncome),
    },
    {
      name: 'Копилки',
      value: planSavings,
      percentage: calculatePercentage(planSavings, planIncome),
    },
    {
      name: 'Остаток',
      value: planIncome - planSavings - planExpenses - plan.mandatoryExpenses - plan.tax,
      percentage: calculatePercentage(
        planIncome - planSavings - planExpenses - plan.mandatoryExpenses - plan.tax,
        planIncome
      ),
    },
  ]

  if (!actual) {
    return { planData }
  }

  const actualIncome = calculateActualTotalIncome(actual)
  const actualExpenses = calculateActualTotalExpenses(actual)
  const actualSavings = calculateActualTotalSavings(actual)

  const actualData: ChartDataPoint[] = [
    {
      name: 'Расходы',
      value: actualExpenses,
      percentage: calculatePercentage(actualExpenses, actualIncome),
    },
    {
      name: 'Копилки',
      value: actualSavings,
      percentage: calculatePercentage(actualSavings, actualIncome),
    },
    {
      name: 'Остаток',
      value: actualIncome - actualSavings - actualExpenses - actual.tax,
      percentage: calculatePercentage(
        actualIncome - actualSavings - actualExpenses - actual.tax,
        actualIncome
      ),
    },
  ]

  return { planData, actualData }
}

export const prepareCategoryComparison = (
  plan: FinancialData,
  actual?: ActualFinancialData
): ComparisonDataPoint[] => {
  const data: ComparisonDataPoint[] = []

  // Доходы
  const planIncome = calculateTotalIncome(plan)
  const actualIncome = actual ? calculateActualTotalIncome(actual) : 0

  data.push({
    name: 'Доход',
    plan: planIncome,
    actual: actualIncome,
    deviation: actual ? ((actualIncome - planIncome) / planIncome) * 100 : undefined,
  })

  // Расходы
  const planExpenses = calculateTotalExpenses(plan) + plan.mandatoryExpenses
  const actualExpenses = actual ? calculateActualTotalExpenses(actual) : 0

  data.push({
    name: 'Расходы',
    plan: planExpenses,
    actual: actualExpenses,
    deviation: actual ? ((actualExpenses - planExpenses) / planExpenses) * 100 : undefined,
  })

  // Копилки
  const planSavings = calculateTotalSavings(plan)
  const actualSavings = actual ? calculateActualTotalSavings(actual) : 0

  data.push({
    name: 'Копилки',
    plan: planSavings,
    actual: actualSavings,
    deviation: actual ? ((actualSavings - planSavings) / planSavings) * 100 : undefined,
  })

  // Налог
  data.push({
    name: 'Налог',
    plan: plan.tax,
    actual: actual?.tax || 0,
    deviation: actual && plan.tax > 0 ? ((actual.tax - plan.tax) / plan.tax) * 100 : undefined,
  })

  return data
}

export const prepareMonthlyTrendData = (
  reports: Array<{ month: number; plan: FinancialData; actual?: ActualFinancialData }>
): {
  months: string[]
  incomePlan: number[]
  incomeActual: number[]
  expensesPlan: number[]
  expensesActual: number[]
  savingsPlan: number[]
  savingsActual: number[]
} => {
  const monthNames = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
  ]

  const sortedReports = [...reports].sort((a, b) => a.month - b.month)

  const months = sortedReports.map((r) => monthNames[r.month - 1])
  const incomePlan = sortedReports.map((r) => calculateTotalIncome(r.plan))
  const incomeActual = sortedReports.map((r) =>
    r.actual ? calculateActualTotalIncome(r.actual) : 0
  )
  const expensesPlan = sortedReports.map(
    (r) => calculateTotalExpenses(r.plan) + r.plan.mandatoryExpenses
  )
  const expensesActual = sortedReports.map((r) =>
    r.actual ? calculateActualTotalExpenses(r.actual) : 0
  )
  const savingsPlan = sortedReports.map((r) => calculateTotalSavings(r.plan))
  const savingsActual = sortedReports.map((r) =>
    r.actual ? calculateActualTotalSavings(r.actual) : 0
  )

  return {
    months,
    incomePlan,
    incomeActual,
    expensesPlan,
    expensesActual,
    savingsPlan,
    savingsActual,
  }
}

export const COLORS = {
  plan: '#3b82f6',
  actual: '#10b981',
  expense: '#ef4444',
  savings: '#8b5cf6',
  remainder: '#f59e0b',
}

