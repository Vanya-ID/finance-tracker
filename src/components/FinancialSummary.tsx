import React from 'react'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  totalIncome: number
  totalSavings: number
  mandatoryExpenses: number
  totalExpenses: number
  tax: number
  balance: number
  mandatoryExpensesPercentage: number
  onMandatoryExpensesChange: (value: number) => void
  onTaxChange: (value: number) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  totalIncome,
  totalSavings,
  mandatoryExpenses,
  totalExpenses,
  tax,
  balance,
  mandatoryExpensesPercentage,
  onMandatoryExpensesChange,
  onTaxChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const calculatePercentage = (amount: number): number => {
    return totalIncome > 0 ? (amount / totalIncome) * 100 : 0
  }

  // Обязательные расходы = сумма из блока расходов + ручной ввод
  const totalMandatoryExpenses = totalExpenses + mandatoryExpenses
  const totalExpense = totalMandatoryExpenses + tax
  
  // Рекомендуемая сумма обязательных расходов из процента правила
  const recommendedMandatoryExpenses = totalIncome > 0 && mandatoryExpensesPercentage > 0
    ? Math.round(totalIncome * mandatoryExpensesPercentage / 100)
    : 0
  
  // Проверяем превышение относительно рекомендуемой суммы, а не afterSavings
  const isOverRecommended = recommendedMandatoryExpenses > 0 && totalMandatoryExpenses > recommendedMandatoryExpenses
  const overRecommendedAmount = isOverRecommended ? totalMandatoryExpenses - recommendedMandatoryExpenses : 0

  return (
    <div className="financial-summary">
      <div className="section-header" onClick={onToggleCollapse}>
        <h2 className="section-title">
          <span className="section-icon">📊</span>
          Финансовый обзор
        </h2>
        <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="summary-grid">
          <div className="summary-card income">
            <label>Доход</label>
            <span className="summary-value">
              {totalIncome.toLocaleString('ru-RU')} Br
            </span>
            <span className="summary-percentage">100%</span>
          </div>

          <div className="summary-card savings">
            <label>Копилка</label>
            <span className="summary-value">{totalSavings.toLocaleString('ru-RU')} Br</span>
            <span className="summary-percentage">{calculatePercentage(totalSavings).toFixed(1)}%</span>
          </div>

          <div className={`summary-card mandatory ${isOverRecommended ? 'warning' : ''}`}>
          <label>
            Обязательные расходы
            {isOverRecommended && (
              <span className="warning-icon" title="Обязательные расходы превышают рекомендуемую сумму">⚠️</span>
            )}
          </label>
          <input
            type="number"
            value={mandatoryExpenses}
            onChange={(e) => onMandatoryExpensesChange(Number(e.target.value))}
            className="summary-input"
            placeholder="Дополнительные расходы"
          />
          <span className="summary-value">{totalMandatoryExpenses.toLocaleString('ru-RU')} Br</span>
          <span className="summary-percentage">{calculatePercentage(totalMandatoryExpenses).toFixed(1)}%</span>
          {totalExpenses > 0 && (
            <span className="summary-note">(расходы из блока: {totalExpenses.toLocaleString('ru-RU')} Br)</span>
          )}
          {recommendedMandatoryExpenses > 0 && (
            <span className="summary-note">(рекомендуется: {recommendedMandatoryExpenses.toLocaleString('ru-RU')} Br ({mandatoryExpensesPercentage}%))</span>
          )}
          {isOverRecommended && (
            <span className="warning-message">
              ⚠️ Превышение на {overRecommendedAmount.toLocaleString('ru-RU')} Br
            </span>
          )}
        </div>

          <div className="summary-card tax">
            <label>Налог</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => onTaxChange(Number(e.target.value))}
              className="summary-input"
            />
            <span className="summary-value">{tax.toLocaleString('ru-RU')} Br</span>
            <span className="summary-percentage">{calculatePercentage(tax).toFixed(1)}%</span>
          </div>

          <div className="summary-card expense-total">
            <label>Итоговый расход</label>
            <span className="summary-value">
              {totalExpense.toLocaleString('ru-RU')} Br
            </span>
            <span className="summary-percentage">{calculatePercentage(totalExpense).toFixed(1)}%</span>
          </div>

          <div className="summary-card balance">
            <label>Остаток</label>
            <span className="summary-value">{balance.toLocaleString('ru-RU')} Br</span>
            <span className="summary-percentage">{calculatePercentage(balance).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

