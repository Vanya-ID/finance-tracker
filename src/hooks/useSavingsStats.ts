import { useState, useEffect, useMemo } from 'react'
import { SavingsTransaction, SavingsStats, SavingsItem } from '../types'
import { useReports } from './useReports'
import { useFinancialData } from './useFinancialData'
import { useDatabase } from './useDatabase'

export const useSavingsStats = () => {
  const { reports } = useReports()
  const { data } = useFinancialData()
  const { saveSavingsWithdrawals: saveWithdrawalsToDB, loadSavingsWithdrawals: loadWithdrawalsFromDB } = useDatabase()
  const [withdrawals, setWithdrawals] = useState<SavingsTransaction[]>([])
  const [loading, setLoading] = useState(true)

  // Загрузка вычетов из Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const firebaseWithdrawals = await loadWithdrawalsFromDB()
        setWithdrawals(firebaseWithdrawals)
      } catch (error) {
        console.error('Ошибка загрузки вычетов:', error)
        setWithdrawals([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadWithdrawalsFromDB])

  // Сохранение вычетов в Firebase (только если были изменения после загрузки)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  useEffect(() => {
    if (!loading) {
      if (isInitialLoad) {
        setIsInitialLoad(false)
        return
      }
      const saveData = async () => {
        try {
          await saveWithdrawalsToDB(withdrawals)
        } catch (error) {
          console.error('Ошибка сохранения вычетов:', error)
        }
      }
      saveData()
    }
  }, [withdrawals, loading, saveWithdrawalsToDB, isInitialLoad])

  // Создаем транзакции пополнения из отчетов
  const depositTransactions = useMemo(() => {
    const deposits: SavingsTransaction[] = []
    
    reports.forEach((report) => {
      // Используем actual данные если есть, иначе используем plan
      const savingsData = report.actual?.savings && report.actual.savings.length > 0
        ? report.actual.savings
        : report.plan.savings
      
      savingsData.forEach((saving) => {
        if (saving.amount > 0) {
          deposits.push({
            id: `deposit-${report.year}-${report.month}-${saving.id}-${report.createdAt}`,
            savingsId: saving.id,
            amount: saving.amount,
            year: report.year,
            month: report.month,
            type: 'deposit',
            createdAt: report.createdAt,
          })
        }
      })
    })
    
    return deposits
  }, [reports])

  // Объединяем все транзакции
  const allTransactions = useMemo(() => {
    return [...depositTransactions, ...withdrawals].sort((a, b) => {
      // Сортируем по дате (год, месяц, время создания)
      if (a.year !== b.year) return b.year - a.year
      if (a.month !== b.month) return b.month - a.month
      return b.createdAt - a.createdAt
    })
  }, [depositTransactions, withdrawals])

  // Получаем статистику по всем копилкам
  const stats = useMemo(() => {
    const statsMap = new Map<string, SavingsStats>()
    const savingsNameCache = new Map<string, string>()
    
    // Находим названия всех копилок из отчетов (для удаленных копилок)
    reports.forEach((report) => {
      // Используем actual данные если есть, иначе используем plan
      const savingsData = report.actual?.savings && report.actual.savings.length > 0
        ? report.actual.savings
        : report.plan.savings
      
      savingsData.forEach((saving) => {
        if (!savingsNameCache.has(saving.id)) {
          savingsNameCache.set(saving.id, saving.name)
        }
      })
    })
    
    // Инициализируем статистику для всех текущих копилок
    data.savings.forEach((saving) => {
      statsMap.set(saving.id, {
        savingsId: saving.id,
        savingsName: saving.name,
        icon: saving.icon,
        totalDeposited: 0,
        totalWithdrawn: 0,
        currentBalance: 0,
      })
      // Обновляем кэш названий
      savingsNameCache.set(saving.id, saving.name)
    })

    // Обрабатываем все транзакции
    allTransactions.forEach((transaction) => {
      let stat = statsMap.get(transaction.savingsId)
      
      if (!stat) {
        // Если копилка была удалена, создаем запись для статистики
        const savingsName = savingsNameCache.get(transaction.savingsId) || 'Удаленная копилка'
        stat = {
          savingsId: transaction.savingsId,
          savingsName,
          icon: undefined,
          totalDeposited: 0,
          totalWithdrawn: 0,
          currentBalance: 0,
        }
        statsMap.set(transaction.savingsId, stat)
      }
      
      if (transaction.type === 'deposit') {
        stat.totalDeposited += transaction.amount
      } else {
        stat.totalWithdrawn += Math.abs(transaction.amount)
      }
    })

    // Рассчитываем текущий баланс
    statsMap.forEach((stat) => {
      stat.currentBalance = stat.totalDeposited - stat.totalWithdrawn
    })

    return Array.from(statsMap.values())
  }, [allTransactions, data.savings, reports])

  // Добавить вычет
  const addWithdrawal = (savingsId: string, amount: number, description?: string) => {
    const currentDate = new Date()
    const transaction: SavingsTransaction = {
      id: `withdrawal-${Date.now()}-${Math.random()}`,
      savingsId,
      amount: -Math.abs(amount), // Всегда отрицательное
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      type: 'withdrawal',
      createdAt: Date.now(),
      description,
    }
    setWithdrawals((prev) => [...prev, transaction])
  }

  // Получить транзакции для конкретной копилки
  const getTransactionsForSavings = (savingsId: string): SavingsTransaction[] => {
    return allTransactions.filter((t) => t.savingsId === savingsId)
  }

  // Удалить транзакцию вычета (только вычеты можно удалять)
  const deleteWithdrawal = (transactionId: string) => {
    setWithdrawals((prev) => prev.filter((t) => t.id !== transactionId))
  }

  return {
    stats,
    allTransactions,
    addWithdrawal,
    getTransactionsForSavings,
    deleteWithdrawal,
    loading,
  }
}

