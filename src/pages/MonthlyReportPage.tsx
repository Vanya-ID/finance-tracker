import React, { useState, useMemo } from 'react'
import { useFinancialData } from '../hooks/useFinancialData'
import { useReports } from '../hooks/useReports'
import { useNotification } from '../contexts/NotificationContext'
import { ActualDataInput } from '../components/ActualDataInput'
import { PlanVsActualChart } from '../components/PlanVsActualChart'
import { prepareDistributionData, prepareCategoryComparison } from '../utils/chartData'
import './MonthlyReportPage.css'

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const MonthlyReportPage: React.FC = () => {
  const { data: currentPlan } = useFinancialData()
  const { reports, getReport, updateReportActual, updateReportPlan } = useReports()
  const { showNotification } = useNotification()

  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)

  const report = useMemo(() => {
    return getReport(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, getReport, reports])

  const plan = report?.plan || currentPlan

  const handleSaveActual = async (actual: any) => {
    try {
      await updateReportActual(selectedYear, selectedMonth, actual, currentPlan)
      showNotification('Фактические данные сохранены', 'success')
    } catch (error) {
      console.error('Ошибка сохранения фактических данных:', error)
      showNotification('Ошибка сохранения данных', 'error')
    }
  }

  const { planData, actualData } = prepareDistributionData(plan, report?.actual)
  const comparisonData = prepareCategoryComparison(plan, report?.actual)

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  return (
    <div className="monthly-report-page">
      <div className="report-header">
        <h2>Отчет за месяц</h2>
        <div className="date-selectors">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="date-select"
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="date-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-content">
        <div className="report-section">
          <div className="plan-section-header">
            <h3>План</h3>
            {report && (
              <button
                className="btn-update-plan"
                onClick={async () => {
                  try {
                    await updateReportPlan(selectedYear, selectedMonth, currentPlan)
                    showNotification('План обновлен из текущего', 'success')
                  } catch (error) {
                    console.error('Ошибка обновления плана:', error)
                    showNotification('Ошибка обновления плана', 'error')
                  }
                }}
                title="Обновить план из текущего"
              >
                🔄 Обновить план
              </button>
            )}
          </div>
          <div className="plan-summary">
            <div className="summary-item">
              <span className="summary-label">Доход:</span>
              <span className="summary-value">
                {plan.incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString('ru-RU')} Br
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Расходы:</span>
              <span className="summary-value">
                {(plan.expenses.reduce((sum, e) => sum + e.amount, 0) + plan.mandatoryExpenses).toLocaleString('ru-RU')} Br
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Копилки:</span>
              <span className="summary-value">
                {plan.savings.reduce((sum, s) => sum + s.amount, 0).toLocaleString('ru-RU')} Br
              </span>
            </div>
          </div>
        </div>

        <ActualDataInput plan={plan} actual={report?.actual} onSave={handleSaveActual} />

        {report?.actual && (
          <>
            <PlanVsActualChart
              type="pie"
              planData={planData}
              actualData={actualData}
              title="Распределение средств"
            />
            <PlanVsActualChart
              type="bar"
              planData={planData}
              comparisonData={comparisonData}
              title="Сравнение план vs факт"
            />
          </>
        )}
      </div>
    </div>
  )
}

