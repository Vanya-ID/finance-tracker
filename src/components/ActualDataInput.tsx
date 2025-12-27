import React, { useState, useEffect } from 'react'
import { ActualFinancialData, FinancialData } from '../types'
import './ActualDataInput.css'

interface ActualDataInputProps {
  plan: FinancialData
  actual?: ActualFinancialData
  onSave: (actual: ActualFinancialData) => void
}

type InputMode = 'categories' | 'totals'

export const ActualDataInput: React.FC<ActualDataInputProps> = ({ plan, actual, onSave }) => {
  const [mode, setMode] = useState<InputMode>(actual?.totalIncome !== undefined ? 'totals' : 'categories')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState<ActualFinancialData>(() => {
    if (actual) {
      return actual
    }
    
    // Если actual нет, подставляем значения из плана по умолчанию
    return {
      incomes: plan.incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount })),
      expenses: plan.expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount })),
      savings: plan.savings.map((s) => ({ id: s.id, name: s.name, amount: s.amount })),
      tax: plan.tax || 0,
      mandatoryExpenses: 0, // Не используется в UI, но оставляем для совместимости
    }
  })

  // Обновляем formData когда actual меняется
  useEffect(() => {
    if (actual) {
      setFormData(actual)
      setMode(actual.totalIncome !== undefined ? 'totals' : 'categories')
    } else {
      // Если actual нет, подставляем значения из плана
      setFormData({
        incomes: plan.incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount })),
        expenses: plan.expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount })),
        savings: plan.savings.map((s) => ({ id: s.id, name: s.name, amount: s.amount })),
        tax: plan.tax || 0,
        mandatoryExpenses: 0, // Не используется в UI, но оставляем для совместимости
      })
      setMode('categories')
    }
  }, [actual, plan])

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode)
    if (newMode === 'totals' && !formData.totalIncome) {
        setFormData({
          incomes: [],
          expenses: [],
          savings: [],
          tax: formData.tax,
          mandatoryExpenses: 0, // Не используется в UI
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
        })
    } else if (newMode === 'categories') {
      // При переключении на режим "По категориям", используем сохраненные данные если есть
      if (actual?.incomes && actual.incomes.length > 0) {
        // Есть сохраненные данные по категориям - используем их
        setFormData({
          incomes: plan.incomes.map((planItem) => {
            const actualItem = actual.incomes.find((a) => a.id === planItem.id)
            return { id: planItem.id, name: planItem.name, amount: actualItem?.amount || 0 }
          }),
          expenses: plan.expenses.map((planItem) => {
            const actualItem = actual.expenses.find((a) => a.id === planItem.id)
            return { id: planItem.id, name: planItem.name, amount: actualItem?.amount || 0 }
          }),
          savings: plan.savings.map((planItem) => {
            const actualItem = actual.savings.find((a) => a.id === planItem.id)
            return { id: planItem.id, name: planItem.name, amount: actualItem?.amount || 0 }
          }),
          tax: actual.tax ?? formData.tax,
          mandatoryExpenses: 0, // Не используется в UI
        })
      } else if (actual && actual.totalIncome !== undefined) {
        // Данные были сохранены в режиме "Итоги", но нет разбивки по категориям
        // Создаем структуру с нулями, но сохраняем налог и обязательные расходы
        setFormData({
          incomes: plan.incomes.map((i) => ({ id: i.id, name: i.name, amount: 0 })),
          expenses: plan.expenses.map((e) => ({ id: e.id, name: e.name, amount: 0 })),
          savings: plan.savings.map((s) => ({ id: s.id, name: s.name, amount: 0 })),
          tax: actual.tax ?? formData.tax,
          mandatoryExpenses: 0, // Не используется в UI
        })
      } else {
        // Нет сохраненных данных - создаем с нулями, но сохраняем текущие значения налога
        setFormData({
          incomes: plan.incomes.map((i) => ({ id: i.id, name: i.name, amount: 0 })),
          expenses: plan.expenses.map((e) => ({ id: e.id, name: e.name, amount: 0 })),
          savings: plan.savings.map((s) => ({ id: s.id, name: s.name, amount: 0 })),
          tax: formData.tax,
          mandatoryExpenses: 0, // Не используется в UI
        })
      }
    }
  }

  const handleSave = () => {
    onSave(formData)
  }

  const handleLoadFromPlan = () => {
    // Подтягиваем значения из плана
    setFormData({
      incomes: plan.incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount })),
      expenses: plan.expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount })),
      savings: plan.savings.map((s) => ({ id: s.id, name: s.name, amount: s.amount })),
      tax: formData.tax || plan.tax,
      mandatoryExpenses: 0, // Не используется в UI
    })
  }

  // Проверяем, нужно ли показывать кнопку "Подтянуть из плана"
  // Показываем, если данные сохранены как итоги, но нет разбивки по категориям
  const shouldShowLoadFromPlan = mode === 'categories' && actual && actual.totalIncome !== undefined && 
    (!actual.incomes || actual.incomes.length === 0 || 
     (actual.incomes.every(i => i.amount === 0) && 
      (!actual.expenses || actual.expenses.length === 0 || actual.expenses.every(e => e.amount === 0)) &&
      (!actual.savings || actual.savings.length === 0 || actual.savings.every(s => s.amount === 0))))

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return newSet
    })
  }

  const handleCategoryChange = (
    type: 'incomes' | 'expenses' | 'savings',
    id: string,
    amount: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((item) =>
        item.id === id ? { ...item, amount: Math.round(amount) } : item
      ),
    }))
  }

  const handleTotalChange = (field: 'totalIncome' | 'totalExpenses' | 'totalSavings' | 'tax', value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.round(value),
    }))
  }

  // Вычисляем итоговые суммы для каждого блока
  const totalIncomes = formData.incomes.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = formData.expenses.reduce((sum, item) => sum + item.amount, 0)
  const totalSavings = formData.savings.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="actual-data-input">
      <div className="input-mode-switcher">
        <button
          className={mode === 'categories' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => handleModeChange('categories')}
        >
          По категориям
        </button>
        <button
          className={mode === 'totals' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => handleModeChange('totals')}
        >
          Итоги
        </button>
      </div>

      {mode === 'categories' ? (
        <div className="categories-input">
          {shouldShowLoadFromPlan && (
            <div className="load-from-plan-section">
              <p className="load-from-plan-text">
                Данные сохранены как итоги. Нажмите кнопку, чтобы заполнить категории значениями из плана:
              </p>
              <button onClick={handleLoadFromPlan} className="btn-load-from-plan">
                📋 Подтянуть из плана
              </button>
            </div>
          )}
          <div className="category-group">
            <div className="category-group-header" onClick={() => toggleSection('incomes')}>
              <div className="category-group-title">
                <h3>Доходы</h3>
                <span className="category-total">Итого: {totalIncomes.toLocaleString('ru-RU')} Br</span>
              </div>
              <span className="collapse-icon">{collapsedSections.has('incomes') ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections.has('incomes') && (
              <>
                {formData.incomes.map((item) => (
              <div key={item.id} className="category-row">
                <label>{item.name}</label>
                <input
                  type="number"
                  step="1"
                  value={item.amount}
                  onChange={(e) => handleCategoryChange('incomes', item.id, Number(e.target.value) || 0)}
                  className="category-input"
                />
                <span>Br</span>
              </div>
                ))}
              </>
            )}
          </div>

          <div className="category-group">
            <div className="category-group-header" onClick={() => toggleSection('expenses')}>
              <div className="category-group-title">
                <h3>Расходы</h3>
                <span className="category-total">Итого: {totalExpenses.toLocaleString('ru-RU')} Br</span>
              </div>
              <span className="collapse-icon">{collapsedSections.has('expenses') ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections.has('expenses') && (
              <>
                {formData.expenses.map((item) => (
              <div key={item.id} className="category-row">
                <label>{item.name}</label>
                <input
                  type="number"
                  step="1"
                  value={item.amount}
                  onChange={(e) => handleCategoryChange('expenses', item.id, Number(e.target.value) || 0)}
                  className="category-input"
                />
                <span>Br</span>
              </div>
                ))}
              </>
            )}
          </div>

          <div className="category-group">
            <div className="category-group-header" onClick={() => toggleSection('savings')}>
              <div className="category-group-title">
                <h3>Копилки</h3>
                <span className="category-total">Итого: {totalSavings.toLocaleString('ru-RU')} Br</span>
              </div>
              <span className="collapse-icon">{collapsedSections.has('savings') ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections.has('savings') && (
              <>
                {formData.savings.map((item) => (
              <div key={item.id} className="category-row">
                <label>{item.name}</label>
                <input
                  type="number"
                  step="1"
                  value={item.amount}
                  onChange={(e) => handleCategoryChange('savings', item.id, Number(e.target.value) || 0)}
                  className="category-input"
                />
                <span>Br</span>
              </div>
                ))}
              </>
            )}
          </div>

          <div className="category-group">
            <div className="category-group-header" onClick={() => toggleSection('additional')}>
              <h3>Дополнительно</h3>
              <span className="collapse-icon">{collapsedSections.has('additional') ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections.has('additional') && (
              <>
                <div className="category-row">
              <label>Налог</label>
              <input
                type="number"
                step="1"
                value={formData.tax}
                onChange={(e) => handleTotalChange('tax', Number(e.target.value) || 0)}
                className="category-input"
              />
              <span>Br</span>
            </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="totals-input">
          <div className="total-row">
            <label>Общий доход</label>
            <input
              type="number"
              step="1"
              value={formData.totalIncome || 0}
              onChange={(e) => handleTotalChange('totalIncome', Number(e.target.value) || 0)}
              className="total-input"
            />
            <span>Br</span>
          </div>
          <div className="total-row">
            <label>Общие расходы</label>
            <input
              type="number"
              step="1"
              value={formData.totalExpenses || 0}
              onChange={(e) => handleTotalChange('totalExpenses', Number(e.target.value) || 0)}
              className="total-input"
            />
            <span>Br</span>
          </div>
          <div className="total-row">
            <label>Общие копилки</label>
            <input
              type="number"
              step="1"
              value={formData.totalSavings || 0}
              onChange={(e) => handleTotalChange('totalSavings', Number(e.target.value) || 0)}
              className="total-input"
            />
            <span>Br</span>
          </div>
          <div className="total-row">
            <label>Налог</label>
            <input
              type="number"
              step="1"
              value={formData.tax}
              onChange={(e) => handleTotalChange('tax', Number(e.target.value) || 0)}
              className="total-input"
            />
            <span>Br</span>
          </div>
        </div>
      )}

      <div className="save-section">
        {actual && (
          <div className="saved-indicator" title="Фактические данные сохранены">
            <span className="saved-icon">✓</span>
            <span className="saved-text">Сохранено</span>
          </div>
        )}
        <button onClick={handleSave} className="save-button">
          {actual ? 'Обновить фактические данные' : 'Сохранить фактические данные'}
        </button>
      </div>
    </div>
  )
}

