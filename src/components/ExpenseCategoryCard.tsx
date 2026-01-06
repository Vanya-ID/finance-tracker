import React, { useState } from 'react'
import { ExpenseItem } from '../types'
import { getCategoryIcon } from '../utils/iconUtils'
import './ExpenseCategoryCard.css'

interface ExpenseCategoryCardProps {
  expense: ExpenseItem
  actualAmount: number  // Фактическая сумма транзакций
  plannedAmount: number  // Плановая сумма из категории расходов
  onDrop: (categoryId: string, amount: number) => void
  onClick?: () => void
}

export const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({
  expense,
  actualAmount,
  plannedAmount,
  onDrop,
  onClick,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragAmount, setDragAmount] = useState<string>('')

  const remainingAmount = Math.max((plannedAmount || 0) - (actualAmount || 0), 0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const amount = parseFloat(dragAmount) || parseFloat(e.dataTransfer.getData('text/plain'))
    if (amount && amount > 0) {
      onDrop(expense.id, amount)
      setDragAmount('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Разрешаем только числа и точку
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setDragAmount(value)
    }
  }

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dragAmount) {
      const amount = parseFloat(dragAmount)
      if (amount && amount > 0) {
        onDrop(expense.id, amount)
        setDragAmount('')
      }
    }
  }

  const handlePlanDragStart = (e: React.DragEvent) => {
    const amountToUse = remainingAmount > 0 ? remainingAmount : plannedAmount || 0
    if (!amountToUse) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', String(amountToUse))
  }

  return (
    <div 
      className={`expense-category-card ${isDragOver ? 'drag-over' : ''}`}
      onClick={onClick}
    >
      <div className="category-icon-large">
        {expense.icon || getCategoryIcon(expense.name)}
      </div>
      
      <div className="category-name">
        {expense.name}
      </div>
      
      <div 
        className="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="text"
          className="drop-zone-input"
          placeholder="Сумма"
          value={dragAmount}
          onChange={handleInputChange}
          onKeyPress={handleInputKeyPress}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="amounts">
        <div className="actual-amount">
          {(actualAmount || 0).toLocaleString('ru-RU')} Br
        </div>
        <div
          className={`planned-amount ${remainingAmount > 0 ? 'has-remaining' : ''}`}
          draggable={Boolean(plannedAmount || remainingAmount)}
          onDragStart={handlePlanDragStart}
          title={remainingAmount > 0 ? 'Перетащите остаток на категорию' : 'Перетащите плановую сумму на категорию'}
        >
          {(plannedAmount || 0).toLocaleString('ru-RU')} Br
          {remainingAmount > 0 && (
            <span className="remaining-amount">
              Остаток: {remainingAmount.toLocaleString('ru-RU')} Br
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

