import React, { useState, useMemo } from 'react'
import { useReports } from '../hooks/useReports'
import { PlanVsActualChart } from '../components/PlanVsActualChart'
import { prepareMonthlyTrendData } from '../utils/chartData'
import './HalfYearReportPage.css'

export const HalfYearReportPage: React.FC = () => {
  const { getReportsByHalfYear, years } = useReports()

  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(
    years.length > 0 ? years[0] : currentDate.getFullYear()
  )
  const [selectedHalfYear, setSelectedHalfYear] = useState<1 | 2>(() => {
    const currentMonth = currentDate.getMonth() + 1
    return currentMonth <= 6 ? 1 : 2
  })

  const halfYearReports = useMemo(() => {
    return getReportsByHalfYear(selectedYear, selectedHalfYear)
  }, [selectedYear, selectedHalfYear, getReportsByHalfYear])

  const trendData = useMemo(() => {
    if (halfYearReports.length === 0) return null
    return prepareMonthlyTrendData(halfYearReports)
  }, [halfYearReports])

  const availableYears = years.length > 0 ? years : [currentDate.getFullYear()]

  // Подготовка данных для сравнения итогов
  const totalComparison = useMemo(() => {
    if (halfYearReports.length === 0) return null

    const totalPlanIncome = halfYearReports.reduce(
      (sum, r) => sum + r.plan.incomes.reduce((s, i) => s + i.amount, 0),
      0
    )
    const totalActualIncome = halfYearReports.reduce(
      (sum, r) => sum + (r.actual?.totalIncome || r.actual?.incomes.reduce((s, i) => s + i.amount, 0) || 0),
      0
    )

    const totalPlanExpenses = halfYearReports.reduce(
      (sum, r) =>
        sum +
        r.plan.expenses.reduce((s, e) => s + e.amount, 0) +
        r.plan.mandatoryExpenses,
      0
    )
    const totalActualExpenses = halfYearReports.reduce(
      (sum, r) =>
        sum +
        (r.actual?.totalExpenses || r.actual?.expenses.reduce((s, e) => s + e.amount, 0) || 0),
      0
    )

    const totalPlanSavings = halfYearReports.reduce(
      (sum, r) => sum + r.plan.savings.reduce((s, sItem) => s + sItem.amount, 0),
      0
    )
    const totalActualSavings = halfYearReports.reduce(
      (sum, r) =>
        sum +
        (r.actual?.totalSavings || r.actual?.savings.reduce((s, sItem) => s + sItem.amount, 0) || 0),
      0
    )

    return [
      {
        name: 'Доход',
        plan: totalPlanIncome,
        actual: totalActualIncome,
        deviation: totalPlanIncome > 0 ? ((totalActualIncome - totalPlanIncome) / totalPlanIncome) * 100 : undefined,
      },
      {
        name: 'Расходы',
        plan: totalPlanExpenses,
        actual: totalActualExpenses,
        deviation: totalPlanExpenses > 0 ? ((totalActualExpenses - totalPlanExpenses) / totalPlanExpenses) * 100 : undefined,
      },
      {
        name: 'Копилки',
        plan: totalPlanSavings,
        actual: totalActualSavings,
        deviation: totalPlanSavings > 0 ? ((totalActualSavings - totalPlanSavings) / totalPlanSavings) * 100 : undefined,
      },
    ]
  }, [halfYearReports])

  const halfYearLabel = selectedHalfYear === 1 ? '1-е полугодие (Январь-Июнь)' : '2-е полугодие (Июль-Декабрь)'

  return (
    <div className="half-year-report-page">
      <div className="report-header">
        <h2>Отчет за полгода</h2>
        <div className="date-selectors">
          <select
            value={selectedHalfYear}
            onChange={(e) => setSelectedHalfYear(Number(e.target.value) as 1 | 2)}
            className="date-select"
          >
            <option value={1}>1-е полугодие (Янв-Июн)</option>
            <option value={2}>2-е полугодие (Июл-Дек)</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="date-select"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {halfYearReports.length === 0 ? (
        <div className="empty-state">
          <p>Нет данных за {halfYearLabel.toLowerCase()} {selectedYear}. Создайте отчеты за месяц в разделе "Отчеты".</p>
        </div>
      ) : (
        <div className="report-content">
          <div className="report-info">
            <h3>{halfYearLabel} {selectedYear}</h3>
            <p>Месяцев с данными: {halfYearReports.length} из 6</p>
          </div>

          {trendData && (
            <>
              <div className="report-section">
                <h3>Динамика доходов</h3>
                <PlanVsActualChart
                  type="line"
                  comparisonData={trendData.months.map((month, index) => ({
                    name: month,
                    plan: trendData.incomePlan[index],
                    actual: trendData.incomeActual[index],
                    deviation: trendData.incomePlan[index] > 0
                      ? ((trendData.incomeActual[index] - trendData.incomePlan[index]) / trendData.incomePlan[index]) * 100
                      : undefined,
                  }))}
                  title=""
                />
              </div>

              <div className="report-section">
                <h3>Динамика расходов</h3>
                <PlanVsActualChart
                  type="line"
                  comparisonData={trendData.months.map((month, index) => ({
                    name: month,
                    plan: trendData.expensesPlan[index],
                    actual: trendData.expensesActual[index],
                    deviation: trendData.expensesPlan[index] > 0
                      ? ((trendData.expensesActual[index] - trendData.expensesPlan[index]) / trendData.expensesPlan[index]) * 100
                      : undefined,
                  }))}
                  title=""
                />
              </div>

              <div className="report-section">
                <h3>Динамика копилок</h3>
                <PlanVsActualChart
                  type="line"
                  comparisonData={trendData.months.map((month, index) => ({
                    name: month,
                    plan: trendData.savingsPlan[index],
                    actual: trendData.savingsActual[index],
                    deviation: trendData.savingsPlan[index] > 0
                      ? ((trendData.savingsActual[index] - trendData.savingsPlan[index]) / trendData.savingsPlan[index]) * 100
                      : undefined,
                  }))}
                  title=""
                />
              </div>
            </>
          )}

          {totalComparison && (
            <div className="report-section">
              <h3>Итоговое сравнение за {halfYearLabel.toLowerCase()}</h3>
              <PlanVsActualChart type="bar" planData={[]} comparisonData={totalComparison} title="" />
              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Категория</th>
                      <th>План</th>
                      <th>Факт</th>
                      <th>Отклонение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalComparison.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.plan.toLocaleString('ru-RU')} Br</td>
                        <td>{item.actual.toLocaleString('ru-RU')} Br</td>
                        <td className={item.deviation && item.deviation > 0 ? 'positive' : item.deviation && item.deviation < 0 ? 'negative' : ''}>
                          {item.deviation !== undefined ? `${item.deviation > 0 ? '+' : ''}${item.deviation.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

