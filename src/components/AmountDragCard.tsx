import React, { useState } from 'react'
import './AmountDragCard.css'

export const AmountDragCard: React.FC = () => {
  const [amount, setAmount] = useState<string>('')

  const numericAmount = amount ? Number(amount.replace(',', '.')) : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.')
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!numericAmount || numericAmount <= 0) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', String(numericAmount))
  }

  return (
    <div className="amount-drag-card">
      <div className="amount-drag-title">Быстрая сумма</div>
      <div className="amount-drag-input-row">
        <input
          type="text"
          value={amount}
          onChange={handleChange}
          className="amount-drag-input"
          placeholder="Введите сумму"
        />
        <div
          className={`amount-drag-pill ${numericAmount > 0 ? 'active' : 'disabled'}`}
          draggable={numericAmount > 0}
          onDragStart={handleDragStart}
          title={numericAmount > 0 ? 'Перетащите на категорию расходов' : 'Введите сумму для перетаскивания'}
        >
          {numericAmount > 0 ? `${numericAmount.toLocaleString('ru-RU')} Br` : 'Перетащи'}
        </div>
      </div>
      <div className="amount-drag-hint">
        Введите сумму и перетащите её на нужную категорию расходов
      </div>
    </div>
  )
}


