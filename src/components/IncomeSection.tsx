import React, { useState } from 'react'
import { IncomeItem } from '../types'
import { IconPicker } from './IconPicker'
import { getCategoryIcon } from '../utils/iconUtils'
import './IncomeSection.css'

interface IncomeSectionProps {
  incomes: IncomeItem[]
  onIncomeChange: (id: string, amount: number) => void
  onAddIncome: (name: string) => void
  onRemoveIncome: (id: string) => void
  onIncomeNameChange: (id: string, name: string) => void
  onIncomeIconChange: (id: string, icon: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  incomes,
  onIncomeChange,
  onAddIncome,
  onRemoveIncome,
  onIncomeNameChange,
  onIncomeIconChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [newIncomeName, setNewIncomeName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [iconPickerId, setIconPickerId] = useState<string | null>(null)

  const total = incomes.reduce((sum, item) => sum + Math.round(item.amount), 0)

  const handleAddIncome = () => {
    if (newIncomeName.trim()) {
      onAddIncome(newIncomeName.trim())
      setNewIncomeName('')
    }
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onIncomeNameChange(id, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="income-section">
      <div className="income-header">
        <div className="section-header" onClick={onToggleCollapse}>
          <h2 className="section-title">
            <span className="section-icon">💰</span>
            Доходы
          </h2>
          {onToggleCollapse && (
            <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="income-actions">
          <input
            type="text"
            value={newIncomeName}
            onChange={(e) => setNewIncomeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIncome()}
            placeholder="Название категории"
            className="income-name-input"
          />
          <button onClick={handleAddIncome} className="add-income-btn">
            + Добавить
          </button>
        </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="income-grid">
        {incomes.map((income) => (
          <div key={income.id} className="income-item">
            <div className="income-item-header">
              {editingId === income.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(income.id)
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  onBlur={() => handleSaveEdit(income.id)}
                  className="income-edit-input"
                  autoFocus
                />
              ) : (
                <label
                  className="income-label"
                  onDoubleClick={() => handleStartEdit(income.id, income.name)}
                  title="Двойной клик для редактирования"
                >
                  <span 
                    className="category-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIconPickerId(income.id)
                    }}
                    title="Изменить иконку"
                  >
                    {income.icon || getCategoryIcon(income.name)}
                  </span>
                  {income.name}
                </label>
              )}
              <button
                onClick={() => onRemoveIncome(income.id)}
                className="remove-income-btn"
                title="Удалить"
              >
                ×
              </button>
            </div>
            <input
              type="number"
              step="1"
              value={Math.round(income.amount)}
              onChange={(e) => onIncomeChange(income.id, Math.round(Number(e.target.value) || 0))}
              className="income-input"
              placeholder="0"
            />
            <span className="income-value">{Math.round(income.amount).toLocaleString('ru-RU')} Br</span>
          </div>
        ))}
          </div>

          <div className="income-total">
            <span className="total-label">Итого доходов:</span>
            <span className="total-value">{total.toLocaleString('ru-RU')} Br</span>
          </div>
        </>
      )}
      {iconPickerId && (
        <IconPicker
          currentIcon={incomes.find(i => i.id === iconPickerId)?.icon}
          onSelect={(icon) => {
            onIncomeIconChange(iconPickerId, icon)
            setIconPickerId(null)
          }}
          onClose={() => setIconPickerId(null)}
        />
      )}
    </div>
  )
}

