import React, { useMemo } from 'react'
import { Transaction } from '../types'
import { TransactionItem } from './TransactionItem'
import './TransactionList.css'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Array<{ id: string; name: string; icon?: string }>
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
  filterType?: 'all' | 'income' | 'expense'
  filterCategoryId?: string
  filterDateFrom?: number
  filterDateTo?: number
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  onEdit,
  onDelete,
  filterType = 'all',
  filterCategoryId,
  filterDateFrom,
  filterDateTo,
}) => {
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    if (filterCategoryId) {
      filtered = filtered.filter(t => t.categoryId === filterCategoryId)
    }

    if (filterDateFrom) {
      filtered = filtered.filter(t => t.date >= filterDateFrom)
    }

    if (filterDateTo) {
      filtered = filtered.filter(t => t.date <= filterDateTo)
    }

    return filtered.sort((a, b) => b.date - a.date)
  }, [transactions, filterType, filterCategoryId, filterDateFrom, filterDateTo])

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const dateKey = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
    })

    return groups
  }, [filteredTransactions])

  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return {
      name: category?.name || 'Неизвестная категория',
      icon: category?.icon,
    }
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="transaction-list-empty">
        <p>Транзакций не найдено</p>
      </div>
    )
  }

  return (
    <div className="transaction-list">
      {Object.entries(groupedTransactions).map(([dateKey, dateTransactions]) => (
        <div key={dateKey} className="transaction-group">
          <div className="transaction-group-header">
            <h3>{dateKey}</h3>
            <div className="transaction-group-total">
              Доходы: {dateTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Br
              {' | '}
              Расходы: {dateTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Br
            </div>
          </div>
          <div className="transaction-group-items">
            {dateTransactions.map(transaction => {
              const categoryInfo = getCategoryInfo(transaction.categoryId)
              return (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  categoryName={categoryInfo.name}
                  categoryIcon={categoryInfo.icon}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

