import React, { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useFinancialData } from '../hooks/useFinancialData'
import { useNotification } from '../contexts/NotificationContext'
import { ExpenseCategoryCard } from '../components/ExpenseCategoryCard'
import { PlanExpensesCard } from '../components/PlanExpensesCard'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { Transaction, ExpenseItem } from '../types'
import './TransactionsPage.css'

export const TransactionsPage: React.FC = () => {
  const { showNotification } = useNotification()
  const { data } = useFinancialData()
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategoryTotal,
  } = useTransactions()

  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formDefaults, setFormDefaults] = useState<{
    categoryId?: string
    amount?: number
    type?: 'income' | 'expense'
  }>({})

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Получаем категории расходов из плана
  const expenseCategories = useMemo(() => {
    return data.expenses.map(expense => ({
      id: expense.id,
      name: expense.name,
      icon: expense.icon,
      amount: expense.amount,
    }))
  }, [data.expenses])

  // Получаем категории доходов из плана
  const incomeCategories = useMemo(() => {
    return data.incomes.map(income => ({
      id: income.id,
      name: income.name,
      icon: income.icon,
    }))
  }, [data.incomes])

  // Все категории для формы
  const allCategories = useMemo(() => {
    return [
      ...incomeCategories.map(cat => ({ ...cat, type: 'income' as const })),
      ...expenseCategories.map(cat => ({ ...cat, type: 'expense' as const })),
    ]
  }, [incomeCategories, expenseCategories])

  // Фильтрация по дате (месяц и год)
  const dateFilter = useMemo(() => {
    const dateFrom = new Date(selectedYear, selectedMonth - 1, 1).getTime()
    const dateTo = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).getTime()
    return { dateFrom, dateTo }
  }, [selectedMonth, selectedYear])

  // Общая сумма всех транзакций расходов за выбранный период
  const totalActualExpenses = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date >= dateFilter.dateFrom && tx.date <= dateFilter.dateTo)
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [transactions, dateFilter])

  // Обработка drag and drop на карточку категории
  const handleCategoryDrop = (categoryId: string, amount: number) => {
    setFormDefaults({
      categoryId,
      amount,
      type: 'expense',
    })
    setShowForm(true)
  }

  // Обработка клика на карточку категории
  const handleCategoryClick = (categoryId: string) => {
    setFormDefaults({
      categoryId,
      type: 'expense',
    })
    setShowForm(true)
  }

  // Сохранение транзакции
  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          ...transactionData,
        })
        showNotification('Транзакция обновлена', 'success')
      } else {
        await addTransaction(transactionData)
        showNotification('Транзакция добавлена', 'success')
      }
      setShowForm(false)
      setEditingTransaction(null)
      setFormDefaults({})
      // После успешного сохранения данные обновятся автоматически через useTransactions
    } catch (error) {
      showNotification('Ошибка при сохранении транзакции', 'error')
      console.error(error)
    }
  }

  // Редактирование транзакции
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  // Удаление транзакции
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId)
      showNotification('Транзакция удалена', 'success')
    } catch (error) {
      showNotification('Ошибка при удалении транзакции', 'error')
      console.error(error)
    }
  }

  // Получение фактической суммы по категории за выбранный период
  const getActualAmount = (categoryId: string): number => {
    const total = getCategoryTotal(categoryId, dateFilter.dateFrom, dateFilter.dateTo)
    return typeof total === 'number' && !isNaN(total) ? total : 0
  }

  // Генерация списка месяцев и лет для фильтра
  const currentDate = new Date()
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Транзакции</h1>

        <div className="filters">
          <div className="filter-group">
            <label>Период</label>
            <div className="date-filters">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="filter-select"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleDateString('ru-RU', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="filter-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Тип</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="filter-select"
            >
              <option value="all">Все</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Категория</label>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="filter-select"
            >
              <option value="">Все категории</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon || ''} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="add-transaction-btn"
            onClick={() => {
              setEditingTransaction(null)
              setFormDefaults({})
              setShowForm(true)
            }}
          >
            + Добавить транзакцию
          </button>
        </div>
      </div>

      {/* Карточка плана расходов для drag-n-drop */}
      <PlanExpensesCard
        expenses={data.expenses}
        totalActualExpenses={totalActualExpenses}
      />

      {expenseCategories.length === 0 ? (
        <div className="empty-state">
          <p>Создайте категории расходов в разделе "План" для начала работы с транзакциями</p>
        </div>
      ) : (
        <>
          <div className="categories-section">
            <h2>Категории расходов</h2>
            <div className="categories-grid">
              {expenseCategories.map(expense => {
                const expenseItem: ExpenseItem = {
                  id: expense.id,
                  name: expense.name,
                  amount: expense.amount || 0,
                  icon: expense.icon,
                }
                return (
                  <ExpenseCategoryCard
                    key={expense.id}
                    expense={expenseItem}
                    actualAmount={getActualAmount(expense.id)}
                    plannedAmount={expense.amount || 0}
                    onDrop={handleCategoryDrop}
                    onClick={() => handleCategoryClick(expense.id)}
                  />
                )
              })}
            </div>
          </div>

          <div className="transactions-section">
            <h2>История транзакций</h2>
            <TransactionList
              transactions={transactions}
              categories={allCategories}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              filterType={filterType}
              filterCategoryId={filterCategoryId || undefined}
              filterDateFrom={dateFilter.dateFrom}
              filterDateTo={dateFilter.dateTo}
            />
          </div>
        </>
      )}

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={allCategories}
          defaultCategoryId={formDefaults.categoryId}
          defaultAmount={formDefaults.amount}
          defaultType={formDefaults.type}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowForm(false)
            setEditingTransaction(null)
            setFormDefaults({})
          }}
        />
      )}
    </div>
  )
}

