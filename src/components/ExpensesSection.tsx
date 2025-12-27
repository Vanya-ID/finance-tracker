import React, { useState, useMemo } from 'react'
import { ExpenseItem } from '../types'
import { IconPicker } from './IconPicker'
import { getCategoryIcon } from '../utils/iconUtils'
import './ExpensesSection.css'

interface ExpensesSectionProps {
  expenses: ExpenseItem[]
  totalIncome: number
  mandatoryExpensesPercentage: number
  onExpenseChange: (id: string, amount: number) => void
  onAddCategory: (name: string) => void
  onRemoveCategory: (id: string) => void
  onCategoryNameChange: (id: string, name: string) => void
  onExpenseIconChange: (id: string, icon: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

type SortType = 'name' | 'amount' | 'percentage' | 'none'
type SortDirection = 'asc' | 'desc'

export const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  expenses,
  totalIncome,
  mandatoryExpensesPercentage,
  onExpenseChange,
  onAddCategory,
  onRemoveCategory,
  onCategoryNameChange,
  onExpenseIconChange,
  onReorder,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [iconPickerId, setIconPickerId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [sortType, setSortType] = useState<SortType>('none')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const total = expenses.reduce((sum, item) => sum + Math.round(item.amount), 0)
  const recommendedAmount = totalIncome > 0 && mandatoryExpensesPercentage > 0
    ? (totalIncome * mandatoryExpensesPercentage) / 100
    : 0
  const isOverBudget = recommendedAmount > 0 && total > recommendedAmount
  const overBudgetAmount = isOverBudget ? total - recommendedAmount : 0

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim())
      setNewCategoryName('')
    }
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onCategoryNameChange(id, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses]

    // Фильтрация по названию
    if (filterText.trim()) {
      result = result.filter((expense) =>
        expense.name.toLowerCase().includes(filterText.toLowerCase().trim())
      )
    }

    // Сортировка
    if (sortType !== 'none') {
      result.sort((a, b) => {
        let comparison = 0

        switch (sortType) {
          case 'name':
            comparison = a.name.localeCompare(b.name, 'ru')
            break
          case 'amount':
            comparison = a.amount - b.amount
            break
          case 'percentage':
            const aPercent = totalIncome > 0 ? (a.amount / totalIncome) * 100 : 0
            const bPercent = totalIncome > 0 ? (b.amount / totalIncome) * 100 : 0
            comparison = aPercent - bPercent
            break
        }

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [expenses, filterText, sortType, sortDirection, totalIncome])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const draggedItem = filteredAndSortedExpenses[draggedIndex]
      const dropItem = filteredAndSortedExpenses[dropIndex]
      const originalIndex = expenses.findIndex((e) => e.id === draggedItem.id)
      const targetIndex = expenses.findIndex((e) => e.id === dropItem.id)
      if (originalIndex !== -1 && targetIndex !== -1) {
        onReorder(originalIndex, targetIndex)
        // Сбрасываем сортировку после перестановки, чтобы показать новый порядок
        setSortType('none')
      }
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }


  return (
    <div className="expenses-section">
      <div className="expenses-header">
        <div className="section-header" onClick={onToggleCollapse}>
          <h2 className="section-title">
            <span className="section-icon">💸</span>
            Расходы
          </h2>
          {onToggleCollapse && (
            <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
        <div className="expenses-actions">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Новая категория"
            className="expense-category-input"
          />
          <button onClick={handleAddCategory} className="add-expense-category-btn">
            + Добавить
          </button>
        </div>
        <div className="expenses-filters">
          <div className="filter-group">
            <label className="filter-label">🔍 Поиск:</label>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="По названию..."
              className="expense-filter-input"
            />
          </div>
          <div className="sort-group">
            <label className="filter-label">📊 Сортировка:</label>
            <select
              value={sortType === 'none' ? '' : `${sortType}-${sortDirection}`}
              onChange={(e) => {
                if (e.target.value === '') {
                  setSortType('none')
                } else {
                  const [type, direction] = e.target.value.split('-')
                  setSortType(type as SortType)
                  setSortDirection(direction as SortDirection)
                }
              }}
              className="expense-sort-select"
            >
              <option value="">Без сортировки</option>
              <option value="name-asc">Название ↑ (А-Я)</option>
              <option value="name-desc">Название ↓ (Я-А)</option>
              <option value="amount-asc">Сумма ↑ (Меньше → Больше)</option>
              <option value="amount-desc">Сумма ↓ (Больше → Меньше)</option>
              <option value="percentage-asc">Процент ↑ (Меньше → Больше)</option>
              <option value="percentage-desc">Процент ↓ (Больше → Меньше)</option>
            </select>
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <>
          <div className="expenses-grid">
        {filteredAndSortedExpenses.map((expense, index) => (
          <div
            key={expense.id}
            className={`expense-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="expense-item-header">
              {editingId === expense.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(expense.id)
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  onBlur={() => handleSaveEdit(expense.id)}
                  className="expense-edit-input"
                  autoFocus
                />
              ) : (
                <label
                  className="expense-label"
                  onDoubleClick={() => handleStartEdit(expense.id, expense.name)}
                  title="Двойной клик для редактирования"
                >
                  <span 
                    className="category-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIconPickerId(expense.id)
                    }}
                    title="Изменить иконку"
                  >
                    {expense.icon || getCategoryIcon(expense.name)}
                  </span>
                  {expense.name}
                </label>
              )}
              <button
                onClick={() => onRemoveCategory(expense.id)}
                className="remove-expense-btn"
                title="Удалить"
              >
                ×
              </button>
            </div>
            <input
              type="number"
              step="1"
              value={Math.round(expense.amount)}
              onChange={(e) => onExpenseChange(expense.id, Math.round(Number(e.target.value) || 0))}
              className="expense-input"
              placeholder="0"
            />
            <span className="expense-value">{Math.round(expense.amount).toLocaleString('ru-RU')} Br</span>
            <div className="drag-handle" title="Перетащите для изменения порядка">
              ⋮⋮
            </div>
          </div>
        ))}
      </div>
      <div className={`expenses-total ${isOverBudget ? 'warning' : ''}`}>
        <div className="total-row">
          <span className="total-label">Итого расходов:</span>
          <span className="total-value">{total.toLocaleString('ru-RU')} Br</span>
        </div>
        {recommendedAmount > 0 && (
          <div className="total-recommended">
            <span className="recommended-label">Рекомендуется:</span>
            <span className="recommended-value">
              {recommendedAmount.toLocaleString('ru-RU')} Br ({mandatoryExpensesPercentage}%)
            </span>
          </div>
        )}
        {isOverBudget && (
          <div className="warning-message">
            <span className="warning-icon">⚠️</span>
            Превышение на {overBudgetAmount.toLocaleString('ru-RU')} Br
          </div>
        )}
      </div>
        </>
      )}
      {iconPickerId && (
        <IconPicker
          currentIcon={expenses.find(e => e.id === iconPickerId)?.icon}
          onSelect={(icon) => {
            onExpenseIconChange(iconPickerId, icon)
            setIconPickerId(null)
          }}
          onClose={() => setIconPickerId(null)}
        />
      )}
    </div>
  )
}

