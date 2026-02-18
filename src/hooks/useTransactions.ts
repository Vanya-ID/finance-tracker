import { useState, useEffect, useMemo, useCallback } from 'react'
import { Transaction } from '../types'
import { useDatabase } from './useDatabase'

export interface TransactionsFilter {
  fromDate?: number
  toDate?: number
  type?: 'income' | 'expense' | 'all'
}

export interface CategoryTotals {
  [categoryId: string]: {
    amount: number
  }
}

export const useTransactions = () => {
  const { loadTransactions, createTransaction, updateTransaction, deleteTransaction } = useDatabase()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<TransactionsFilter>({ type: 'all' })

  const load = useCallback(
    async (overrideFilter?: TransactionsFilter) => {
      const effectiveFilter = overrideFilter ?? filter
      setLoading(true)
      try {
        const items = await loadTransactions(effectiveFilter.fromDate, effectiveFilter.toDate)
        setTransactions(items || [])
      } catch (error) {
        console.error('Ошибка загрузки транзакций:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    },
    [filter, loadTransactions]
  )

  useEffect(() => {
    load()
  }, [load])

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        if (filter.type && filter.type !== 'all' && t.type !== filter.type) {
          return false
        }
        if (filter.fromDate && t.date < filter.fromDate) {
          return false
        }
        if (filter.toDate && t.date > filter.toDate) {
          return false
        }
        return true
      }),
    [transactions, filter]
  )

  const categoryTotals = useMemo<CategoryTotals>(
    () =>
      filteredTransactions.reduce<CategoryTotals>((acc, tx) => {
        if (tx.type !== 'expense') {
          return acc
        }
        const current = acc[tx.categoryId]?.amount ?? 0
        return {
          ...acc,
          [tx.categoryId]: {
            amount: current + tx.amount,
          },
        }
      }, {}),
    [filteredTransactions]
  )

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
      const created = await createTransaction(data)
      if (created) {
        setTransactions((prev) => [created, ...prev])
      }
    },
    [createTransaction]
  )

  const updateExistingTransaction = useCallback(
    async (data: Transaction) => {
      await updateTransaction(data)
      setTransactions((prev) => prev.map((tx) => (tx.id === data.id ? { ...tx, ...data } : tx)))
    },
    [updateTransaction]
  )

  const removeTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((tx) => tx.id !== id))
    },
    [deleteTransaction]
  )

  const setFilterSafe = useCallback((next: TransactionsFilter) => {
    setFilter(next)
  }, [])

  const getCategoryTotal = useCallback(
    (categoryId: string, dateFrom?: number, dateTo?: number): number => {
      return filteredTransactions
        .filter(tx => {
          if (tx.categoryId !== categoryId) return false
          if (dateFrom && tx.date < dateFrom) return false
          if (dateTo && tx.date > dateTo) return false
          return true
        })
        .reduce((sum, tx) => sum + tx.amount, 0)
    },
    [filteredTransactions]
  )

  return {
    transactions: filteredTransactions,
    rawTransactions: transactions,
    loading,
    filter,
    setFilter: setFilterSafe,
    reload: load,
    addTransaction,
    updateTransaction: updateExistingTransaction,
    deleteTransaction: removeTransaction,
    getCategoryTotal,
    categoryTotals,
  }
}


