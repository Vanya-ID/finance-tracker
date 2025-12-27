import React, { useState, useMemo } from 'react'
import { useFinancialData } from '../hooks/useFinancialData'
import { useReports } from '../hooks/useReports'
import { useNotification } from '../contexts/NotificationContext'
import { ActualDataInput } from '../components/ActualDataInput'
import { PlanVsActualChart } from '../components/PlanVsActualChart'
import { prepareDistributionData, prepareCategoryComparison, prepareMonthlyTrendData } from '../utils/chartData'
import './ReportsPage.css'

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'month' | 'half-year' | 'year'>('month')
  const { data: currentPlan } = useFinancialData()
  const { reports, getReport, updateReportActual, updateReportPlan, getReportsByHalfYear, getReportsByYear, years } = useReports()
  const { showNotification } = useNotification()

  const currentDate = new Date()

  // Состояние для месячного отчета
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)

  // Состояние для полугодового отчета
  const [selectedHalfYear, setSelectedHalfYear] = useState<1 | 2>(() => {
    const currentMonth = currentDate.getMonth() + 1
    return currentMonth <= 6 ? 1 : 2
  })
  const [selectedHalfYearYear, setSelectedHalfYearYear] = useState(
    years.length > 0 ? years[0] : currentDate.getFullYear()
  )

  // Состояние для годового отчета
  const [selectedYearlyYear, setSelectedYearlyYear] = useState(
    years.length > 0 ? years[0] : currentDate.getFullYear()
  )

  // Месячный отчет
  const monthlyReport = useMemo(() => {
    return getReport(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, getReport, reports])

  const monthlyPlan = monthlyReport?.plan || currentPlan

  const handleSaveActual = async (actual: any) => {
    try {
      await updateReportActual(selectedYear, selectedMonth, actual, currentPlan)
      showNotification('Фактические данные сохранены', 'success')
    } catch (error) {
      console.error('Ошибка сохранения фактических данных:', error)
      showNotification('Ошибка сохранения данных', 'error')
    }
  }

  const { planData, actualData } = prepareDistributionData(monthlyPlan, monthlyReport?.actual)
  const comparisonData = prepareCategoryComparison(monthlyPlan, monthlyReport?.actual)

  // Полугодовой отчет
  const halfYearReports = useMemo(() => {
    return getReportsByHalfYear(selectedHalfYearYear, selectedHalfYear)
  }, [selectedHalfYearYear, selectedHalfYear, getReportsByHalfYear])

  const halfYearTrendData = useMemo(() => {
    if (halfYearReports.length === 0) return null
    return prepareMonthlyTrendData(halfYearReports)
  }, [halfYearReports])

  // Годовой отчет
  const yearlyReports = useMemo(() => {
    return getReportsByYear(selectedYearlyYear)
  }, [selectedYearlyYear, getReportsByYear])

  const yearlyTrendData = useMemo(() => {
    if (yearlyReports.length === 0) return null
    return prepareMonthlyTrendData(yearlyReports)
  }, [yearlyReports])

  // Подготовка данных для сравнения полугодия
  const halfYearComparison = useMemo(() => {
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

  // Подготовка данных для сравнения года
  const yearlyComparison = useMemo(() => {
    if (yearlyReports.length === 0) return null

    const totalPlanIncome = yearlyReports.reduce(
      (sum, r) => sum + r.plan.incomes.reduce((s, i) => s + i.amount, 0),
      0
    )
    const totalActualIncome = yearlyReports.reduce(
      (sum, r) => sum + (r.actual?.totalIncome || r.actual?.incomes.reduce((s, i) => s + i.amount, 0) || 0),
      0
    )

    const totalPlanExpenses = yearlyReports.reduce(
      (sum, r) =>
        sum +
        r.plan.expenses.reduce((s, e) => s + e.amount, 0) +
        r.plan.mandatoryExpenses,
      0
    )
    const totalActualExpenses = yearlyReports.reduce(
      (sum, r) =>
        sum +
        (r.actual?.totalExpenses || r.actual?.expenses.reduce((s, e) => s + e.amount, 0) || 0),
      0
    )

    const totalPlanSavings = yearlyReports.reduce(
      (sum, r) => sum + r.plan.savings.reduce((s, sItem) => s + sItem.amount, 0),
      0
    )
    const totalActualSavings = yearlyReports.reduce(
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
  }, [yearlyReports])

  const availableYears = years.length > 0 ? years : [currentDate.getFullYear()]
  const yearsOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)
  const halfYearLabel = selectedHalfYear === 1 ? '1-е полугодие (Январь-Июнь)' : '2-е полугодие (Июль-Декабрь)'

  return (
    <div className="reports-page">
      <div className="reports-tabs">
        <button
          className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
          onClick={() => setActiveTab('month')}
        >
          За месяц
        </button>
        <button
          className={`tab-btn ${activeTab === 'half-year' ? 'active' : ''}`}
          onClick={() => setActiveTab('half-year')}
        >
          За полгода
        </button>
        <button
          className={`tab-btn ${activeTab === 'year' ? 'active' : ''}`}
          onClick={() => setActiveTab('year')}
        >
          За год
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'month' && (
          <div className="monthly-report-content">
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
                  {yearsOptions.map((year) => (
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
                  {monthlyReport && (
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
                      {monthlyPlan.incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString('ru-RU')} Br
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Расходы:</span>
                    <span className="summary-value">
                      {(monthlyPlan.expenses.reduce((sum, e) => sum + e.amount, 0) + monthlyPlan.mandatoryExpenses).toLocaleString('ru-RU')} Br
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Копилки:</span>
                    <span className="summary-value">
                      {monthlyPlan.savings.reduce((sum, s) => sum + s.amount, 0).toLocaleString('ru-RU')} Br
                    </span>
                  </div>
                </div>
              </div>

              <ActualDataInput plan={monthlyPlan} actual={monthlyReport?.actual} onSave={handleSaveActual} />

              {monthlyReport?.actual && (
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
        )}

        {activeTab === 'half-year' && (
          <div className="half-year-report-content">
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
                  value={selectedHalfYearYear}
                  onChange={(e) => setSelectedHalfYearYear(Number(e.target.value))}
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
                <p>Нет данных за {halfYearLabel.toLowerCase()} {selectedHalfYearYear}. Создайте отчеты за месяц.</p>
              </div>
            ) : (
              <div className="report-content">
                <div className="report-info">
                  <h3>{halfYearLabel} {selectedHalfYearYear}</h3>
                  <p>Месяцев с данными: {halfYearReports.length} из 6</p>
                </div>

                {halfYearTrendData && (
                  <>
                    <div className="report-section">
                      <h3>Динамика доходов</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={halfYearTrendData.months.map((month, index) => ({
                          name: month,
                          plan: halfYearTrendData.incomePlan[index],
                          actual: halfYearTrendData.incomeActual[index],
                          deviation: halfYearTrendData.incomePlan[index] > 0
                            ? ((halfYearTrendData.incomeActual[index] - halfYearTrendData.incomePlan[index]) / halfYearTrendData.incomePlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>

                    <div className="report-section">
                      <h3>Динамика расходов</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={halfYearTrendData.months.map((month, index) => ({
                          name: month,
                          plan: halfYearTrendData.expensesPlan[index],
                          actual: halfYearTrendData.expensesActual[index],
                          deviation: halfYearTrendData.expensesPlan[index] > 0
                            ? ((halfYearTrendData.expensesActual[index] - halfYearTrendData.expensesPlan[index]) / halfYearTrendData.expensesPlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>

                    <div className="report-section">
                      <h3>Динамика копилок</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={halfYearTrendData.months.map((month, index) => ({
                          name: month,
                          plan: halfYearTrendData.savingsPlan[index],
                          actual: halfYearTrendData.savingsActual[index],
                          deviation: halfYearTrendData.savingsPlan[index] > 0
                            ? ((halfYearTrendData.savingsActual[index] - halfYearTrendData.savingsPlan[index]) / halfYearTrendData.savingsPlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>
                  </>
                )}

                {halfYearComparison && (
                  <div className="report-section">
                    <h3>Итоговое сравнение за {halfYearLabel.toLowerCase()}</h3>
                    <PlanVsActualChart type="bar" planData={[]} comparisonData={halfYearComparison} title="" />
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
                          {halfYearComparison.map((item) => (
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
        )}

        {activeTab === 'year' && (
          <div className="yearly-report-content">
            <div className="report-header">
              <h2>Отчет за год</h2>
              <select
                value={selectedYearlyYear}
                onChange={(e) => setSelectedYearlyYear(Number(e.target.value))}
                className="date-select"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {yearlyReports.length === 0 ? (
              <div className="empty-state">
                <p>Нет данных за {selectedYearlyYear} год. Создайте отчеты за месяц.</p>
              </div>
            ) : (
              <div className="report-content">
                <div className="report-info">
                  <h3>{selectedYearlyYear} год</h3>
                  <p>Месяцев с данными: {yearlyReports.length} из 12</p>
                </div>

                {yearlyTrendData && (
                  <>
                    <div className="report-section">
                      <h3>Динамика доходов</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={yearlyTrendData.months.map((month, index) => ({
                          name: month,
                          plan: yearlyTrendData.incomePlan[index],
                          actual: yearlyTrendData.incomeActual[index],
                          deviation: yearlyTrendData.incomePlan[index] > 0
                            ? ((yearlyTrendData.incomeActual[index] - yearlyTrendData.incomePlan[index]) / yearlyTrendData.incomePlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>

                    <div className="report-section">
                      <h3>Динамика расходов</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={yearlyTrendData.months.map((month, index) => ({
                          name: month,
                          plan: yearlyTrendData.expensesPlan[index],
                          actual: yearlyTrendData.expensesActual[index],
                          deviation: yearlyTrendData.expensesPlan[index] > 0
                            ? ((yearlyTrendData.expensesActual[index] - yearlyTrendData.expensesPlan[index]) / yearlyTrendData.expensesPlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>

                    <div className="report-section">
                      <h3>Динамика копилок</h3>
                      <PlanVsActualChart
                        type="line"
                        comparisonData={yearlyTrendData.months.map((month, index) => ({
                          name: month,
                          plan: yearlyTrendData.savingsPlan[index],
                          actual: yearlyTrendData.savingsActual[index],
                          deviation: yearlyTrendData.savingsPlan[index] > 0
                            ? ((yearlyTrendData.savingsActual[index] - yearlyTrendData.savingsPlan[index]) / yearlyTrendData.savingsPlan[index]) * 100
                            : undefined,
                        }))}
                        title=""
                      />
                    </div>
                  </>
                )}

                {yearlyComparison && (
                  <div className="report-section">
                    <h3>Итоговое сравнение за {selectedYearlyYear} год</h3>
                    <PlanVsActualChart type="bar" planData={[]} comparisonData={yearlyComparison} title="" />
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
                          {yearlyComparison.map((item) => (
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
        )}
      </div>
    </div>
  )
}
