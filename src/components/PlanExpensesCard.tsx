import React, { useState, useMemo } from 'react'
import { ExpenseItem } from '../types'
import './PlanExpensesCard.css'

interface PlanExpensesCardProps {
  expenses: ExpenseItem[]
  totalActualExpenses: number  // Общая сумма всех фактических расходов
}

export const PlanExpensesCard: React.FC<PlanExpensesCardProps> = ({
  expenses,
  totalActualExpenses,
}) => {
  const [draggedAmount, setDraggedAmount] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)

  // Общая сумма плановых расходов
  const totalPlanned = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  }, [expenses])

  // Текущая сумма (изначальная минус фактически потраченное минус перетаскиваемая)
  // При перетаскивании показываем уменьшенную сумму визуально
  const currentAmount = Math.max(0, totalPlanned - totalActualExpenses - draggedAmount)

  const handleDragStart = (e: React.DragEvent) => {
    if (currentAmount <= 0) {
      e.preventDefault()
      return
    }
    setIsDragging(true)
    // Устанавливаем перетаскиваемую сумму равной текущей доступной
    // Это уменьшит отображаемую сумму визуально во время перетаскивания
    setDraggedAmount(currentAmount)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', String(currentAmount))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    // Возвращаем сумму обратно после окончания drag
    // Реальное уменьшение произойдет после создания транзакции и обновления данных
    setDraggedAmount(0)
  }

  return (
    <div className="plan-expenses-card">
      <div className="plan-expenses-header">
        <h2>План расходов</h2>
      </div>
      <div className="plan-expenses-content">
        <div className="plan-expenses-amounts">
          <div className="plan-expenses-original">
            <span className="plan-expenses-label">Изначально:</span>
            <span className="plan-expenses-value-original">
              {totalPlanned.toLocaleString('ru-RU')} Br
            </span>
          </div>
          <div className="plan-expenses-current">
            <span className="plan-expenses-label">Осталось:</span>
            <span className={`plan-expenses-value-current ${isDragging ? 'dragging' : ''}`}>
              {currentAmount.toLocaleString('ru-RU')} Br
            </span>
          </div>
        </div>
        <div
          className={`plan-expenses-drag-area ${currentAmount > 0 ? 'draggable' : 'disabled'}`}
          draggable={currentAmount > 0}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title={currentAmount > 0 ? 'Перетащите на категорию расходов' : 'Нет доступной суммы'}
        >
          <div className="plan-expenses-drag-icon">💰</div>
          <div className="plan-expenses-drag-text">
            {currentAmount > 0 
              ? `Перетащите ${currentAmount.toLocaleString('ru-RU')} Br`
              : 'Нет доступной суммы'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

