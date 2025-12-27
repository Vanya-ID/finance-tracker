import React, { useState, useMemo } from 'react'
import { SavingsItem } from '../types'
import { IconPicker } from './IconPicker'
import { getCategoryIcon } from '../utils/iconUtils'
import './SavingsSection.css'

interface SavingsSectionProps {
  savings: SavingsItem[]
  exchangeRate: number
  availableAmount: number
  savingsPercentage: number
  totalIncome: number
  onSavingsChange: (id: string, amount: number, isCustom: boolean) => void
  onExchangeRateChange: (rate: number) => void
  onAddCategory: (name: string) => void
  onRemoveCategory: (id: string) => void
  onCategoryNameChange: (id: string, name: string) => void
  onSavingsIconChange: (id: string, icon: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

type SortType = 'name' | 'amount' | 'percentage' | 'none'
type SortDirection = 'asc' | 'desc'

export const SavingsSection: React.FC<SavingsSectionProps> = ({
  savings,
  exchangeRate,
  availableAmount,
  savingsPercentage,
  totalIncome,
  onSavingsChange,
  onExchangeRateChange,
  onAddCategory,
  onRemoveCategory,
  onCategoryNameChange,
  onSavingsIconChange,
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

  const total = savings.reduce((sum, item) => sum + Math.round(item.amount), 0)
  const totalUsd = savings.reduce((sum, item) => sum + item.amountUsd, 0)
  const availableForSavings = savingsPercentage > 0 ? Math.round(totalIncome * savingsPercentage / 100) : availableAmount
  const availablePercentage = savingsPercentage > 0 ? savingsPercentage : (totalIncome > 0 ? (availableAmount / totalIncome) * 100 : 0)
  const totalPercentage = totalIncome > 0
    ? savings.reduce((sum, item) => sum + (Math.round(item.amount) / totalIncome * 100), 0)
    : 0
  const isOverBudget = availableForSavings > 0 && total > availableForSavings
  const overBudgetAmount = isOverBudget ? total - availableForSavings : 0

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

  const filteredAndSortedSavings = useMemo(() => {
    let result = [...savings]

    // Фильтрация по названию
    if (filterText.trim()) {
      result = result.filter((saving) =>
        saving.name.toLowerCase().includes(filterText.toLowerCase().trim())
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
  }, [savings, filterText, sortType, sortDirection, totalIncome])

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
      const draggedItem = filteredAndSortedSavings[draggedIndex]
      const dropItem = filteredAndSortedSavings[dropIndex]
      const originalIndex = savings.findIndex((s) => s.id === draggedItem.id)
      const targetIndex = savings.findIndex((s) => s.id === dropItem.id)
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
    <div className="savings-section">
      <div className="savings-header">
        <div className="section-header" onClick={onToggleCollapse}>
          <h2 className="section-title">
            <span className="section-icon">🐷</span>
            Копилка
          </h2>
          {onToggleCollapse && (
            <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className={`available-amount-info ${isOverBudget ? 'warning' : ''}`}>
            <span className="available-label">Доступно для копилок:</span>
            <span className="available-value">{availableForSavings.toLocaleString('ru-RU')} Br</span>
            <span className="available-percentage">({availablePercentage.toFixed(1)}% от дохода)</span>
            {isOverBudget && (
              <span className="warning-message">
                ⚠️ Превышение на {overBudgetAmount.toLocaleString('ru-RU')} Br
              </span>
            )}
          </div>
        )}
        {!isCollapsed && (
          <div className="savings-header-right">
            <div className="exchange-rate">
              <label>Курс $:</label>
              <input
                type="number"
                step="0.1"
                value={exchangeRate}
                onChange={(e) => onExchangeRateChange(Number(e.target.value))}
                className="exchange-input"
              />
            </div>
            <div className="add-category-section">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Новая копилка"
                className="category-name-input"
              />
              <button onClick={handleAddCategory} className="add-category-btn">
                + Добавить
              </button>
            </div>
          </div>
        )}
        {!isCollapsed && (
          <div className="savings-filters">
            <div className="filter-group">
              <label className="filter-label">🔍 Поиск:</label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="По названию..."
                className="savings-filter-input"
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
                className="savings-sort-select"
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
        )}
      </div>

      {!isCollapsed && (
        <div className="savings-table">
          <div className="savings-row header">
            <div className="savings-cell name">Название</div>
            <div className="savings-cell amount">Сумма (Br)</div>
            <div className="savings-cell amount-usd">В $</div>
            <div className="savings-cell percentage">%</div>
            <div className="savings-cell actions"></div>
          </div>

          {filteredAndSortedSavings.map((item, index) => (
            <div
              key={item.id}
              className={`savings-row ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="savings-cell name">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(item.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleSaveEdit(item.id)}
                    className="savings-name-edit"
                    autoFocus
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartEdit(item.id, item.name)}
                    title="Двойной клик для редактирования"
                    className="savings-name-text"
                  >
                    <span
                      className="category-icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIconPickerId(item.id)
                      }}
                      title="Изменить иконку"
                    >
                      {item.icon || getCategoryIcon(item.name)}
                    </span>
                    {item.name}
                  </span>
                )}
              </div>
              <div className="savings-cell amount" data-label="Сумма (Br):">
                <input
                  type="number"
                  step="1"
                  value={Math.round(item.amount)}
                  onChange={(e) => onSavingsChange(item.id, Math.round(Number(e.target.value) || 0), true)}
                  className="savings-input"
                />
              </div>
              <div className="savings-cell amount-usd" data-label="В $:">
                {item.amountUsd.toFixed(2)} $
              </div>
              <div className="savings-cell percentage" data-label="%:">
                {item.amount > 0 && totalIncome > 0
                  ? `${((Math.round(item.amount) / totalIncome) * 100).toFixed(1)}%`
                  : '-'}
              </div>
              <div className="savings-cell actions">
                <span className="drag-handle" title="Перетащите для изменения порядка">
                  ⋮⋮
                </span>
                <button
                  onClick={() => onRemoveCategory(item.id)}
                  className="remove-savings-btn"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="savings-row total">
            <div className="savings-cell name">Итог</div>
            <div className="savings-cell amount" data-label="Сумма (Br):">{total.toLocaleString('ru-RU')} Br</div>
            <div className="savings-cell amount-usd" data-label="В $:">{totalUsd.toFixed(2)} $</div>
            <div className="savings-cell percentage" data-label="%:">{totalPercentage.toFixed(1)}%</div>
            <div className="savings-cell actions"></div>
          </div>
        </div>
      )}
      {iconPickerId && (
        <IconPicker
          currentIcon={savings.find(s => s.id === iconPickerId)?.icon}
          onSelect={(icon: string) => {
            onSavingsIconChange(iconPickerId, icon)
            setIconPickerId(null)
          }}
          onClose={() => setIconPickerId(null)}
        />
      )}
    </div>
  )
}

