import React, { useState, useEffect } from 'react'
import { Transaction } from '../types'
import './TransactionForm.css'

interface TransactionFormProps {
  transaction?: Transaction | null
  categories: Array<{ id: string; name: string; icon?: string }>
  defaultCategoryId?: string
  defaultAmount?: number
  defaultType?: 'income' | 'expense'
  onSave: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void
  onCancel: () => void
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  categories,
  defaultCategoryId,
  defaultAmount,
  defaultType = 'expense',
  onSave,
  onCancel,
}) => {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || defaultType || 'expense')
  const [categoryId, setCategoryId] = useState<string>(transaction?.categoryId || defaultCategoryId || '')
  const [amount, setAmount] = useState<string>(transaction?.amount.toString() || defaultAmount?.toString() || '')
  const [date, setDate] = useState<string>(() => {
    if (transaction?.date) {
      const d = new Date(transaction.date)
      return d.toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  const [description, setDescription] = useState<string>(transaction?.description || '')

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setCategoryId(transaction.categoryId)
      setAmount(transaction.amount.toString())
      setDate(new Date(transaction.date).toISOString().split('T')[0])
      setDescription(transaction.description || '')
    } else {
      if (defaultCategoryId && !categoryId) {
        setCategoryId(defaultCategoryId)
      }
      if (defaultAmount && !amount) {
        setAmount(defaultAmount.toString())
      }
      if (defaultType) {
        setType(defaultType)
      }
    }
  }, [transaction, defaultCategoryId, defaultAmount, defaultType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      alert('Введите корректную сумму')
      return
    }

    if (!categoryId) {
      alert('Выберите категорию')
      return
    }

    const selectedCategory = categories.find(c => c.id === categoryId)
    onSave({
      type,
      categoryId,
      categoryName: selectedCategory?.name || '',
      amount: amountNum,
      date: new Date(date).getTime(),
      description: description.trim() || undefined,
    })
  }

  const filteredCategories = categories.filter(() => {
    // Для доходов показываем все категории, для расходов - только категории расходов
    // В будущем можно добавить поле type к категориям
    return true
  })

  return (
    <div className="transaction-form-overlay" onClick={onCancel}>
      <div className="transaction-form" onClick={(e) => e.stopPropagation()}>
        <div className="transaction-form-header">
          <h2>{transaction ? 'Редактировать транзакцию' : 'Новая транзакция'}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Тип</label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                💰 Доход
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                💸 Расход
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Категория</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Выберите категорию</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon || ''} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Сумма (Br)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Описание (необязательно)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              placeholder="Добавить описание..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="btn-save">
              {transaction ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

