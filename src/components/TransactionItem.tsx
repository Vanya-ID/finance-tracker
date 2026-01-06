import React from 'react'
import { Transaction } from '../types'
import './TransactionItem.css'

interface TransactionItemProps {
  transaction: Transaction
  categoryName: string
  categoryIcon?: string
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  categoryName,
  categoryIcon,
  onEdit,
  onDelete,
}) => {
  const date = new Date(transaction.date)
  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const formattedTime = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`transaction-item ${transaction.type}`}>
      <div className="transaction-icon">
        {categoryIcon || '📝'}
      </div>
      
      <div className="transaction-details">
        <div className="transaction-category">{categoryName}</div>
        {transaction.description && (
          <div className="transaction-description">{transaction.description}</div>
        )}
        <div className="transaction-date">
          {formattedDate} в {formattedTime}
        </div>
      </div>

      <div className="transaction-amount">
        {transaction.type === 'income' ? '+' : '-'}
        {transaction.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Br
      </div>

      {(onEdit || onDelete) && (
        <div className="transaction-actions">
          {onEdit && (
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(transaction)}
              title="Редактировать"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="action-btn delete-btn"
              onClick={() => {
                if (window.confirm('Удалить транзакцию?')) {
                  onDelete(transaction.id)
                }
              }}
              title="Удалить"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  )
}

