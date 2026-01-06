import { useState, useMemo, useEffect } from 'react'
import { FinancialData, SavingsItem, DistributionRule, IncomeItem } from '../types'
import {
  calculateSavingsTotal,
  calculateExpensesTotal,
  calculateIncomeTotal,
  calculateBalance,
  calculateUsdAmount,
} from '../utils/calculations'
import { getCategoryIcon } from '../utils/iconUtils'
import { useDatabase } from './useDatabase'

const defaultIncomes: IncomeItem[] = [
  { id: '1', name: 'Работа', amount: 5500, icon: '💼' },
]

const defaultFinancialData: FinancialData = {
  incomes: defaultIncomes,
  exchangeRate: 3,
  savings: [],
  expenses: [],
  tax: 0,
  mandatoryExpenses: 0,
}

export const useFinancialData = () => {
  const {
    saving,
    saveFinancialDataImmediate,
    saveFinancialDataDebounced,
    loadFinancialData: loadFinancialDataFromDB,
    saveSettingsDebounced,
    loadSettings: loadSettingsFromDB,
  } = useDatabase()
  
  const [data, setData] = useState<FinancialData>(defaultFinancialData)
  const [, setDataLoading] = useState(true)
  const [distributionRules, setDistributionRules] = useState<DistributionRule[]>([])
  const [mandatoryExpensesPercentage, setMandatoryExpensesPercentage] = useState<number>(50)
  const [selectedPresetType, setSelectedPresetType] = useState<'50-30-20' | '50-40-10' | 'custom'>('50-30-20')
  const [customPercentages, setCustomPercentages] = useState<{ mandatory: number; savings: number; remainder: number }>({ mandatory: 50, savings: 30, remainder: 20 })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Загрузка финансовых данных из Firebase
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      try {
        const firebaseData = await loadFinancialDataFromDB()
        if (firebaseData) {
          setData(firebaseData)
        } else {
          setData(defaultFinancialData)
        }
      } catch (error) {
        console.error('Ошибка загрузки финансовых данных:', error)
        setData(defaultFinancialData)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [loadFinancialDataFromDB])

  // Загрузка настроек из Firebase
  useEffect(() => {
    const loadSettingsData = async () => {
      setSettingsLoading(true)
      setIsInitialLoad(true)
      try {
        const firebaseSettings = await loadSettingsFromDB()
        if (firebaseSettings) {
          if (firebaseSettings.distributionRules) {
            setDistributionRules(firebaseSettings.distributionRules)
          }
          if (firebaseSettings.mandatoryExpensesPercentage !== undefined) {
            setMandatoryExpensesPercentage(firebaseSettings.mandatoryExpensesPercentage)
          }
          if (firebaseSettings.selectedPresetType) {
            setSelectedPresetType(firebaseSettings.selectedPresetType)
          }
          if (firebaseSettings.customPercentages) {
            setCustomPercentages(firebaseSettings.customPercentages)
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error)
      } finally {
        setSettingsLoading(false)
        // Устанавливаем флаг после небольшой задержки, чтобы пропустить первое сохранение
        setTimeout(() => {
          setIsInitialLoad(false)
        }, 500)
      }
    }

    loadSettingsData()
  }, [loadSettingsFromDB])

  // Сохранение настроек в Firebase (только после загрузки и только при реальных изменениях)
  useEffect(() => {
    if (!settingsLoading && !isInitialLoad) {
      const settingsData = {
        distributionRules,
        mandatoryExpensesPercentage,
        selectedPresetType,
        customPercentages,
      }
      saveSettingsDebounced(settingsData)
    }
  }, [distributionRules, mandatoryExpensesPercentage, selectedPresetType, customPercentages, settingsLoading, isInitialLoad, saveSettingsDebounced])

  useEffect(() => {
    // При смене пресета обновляем только процент обязательных расходов
    // Процент для копилок рассчитывается в компоненте из пресета
    // НЕ сохраняем здесь, так как это вызовет useEffect сохранения
    if (selectedPresetType !== 'custom') {
      const presetPercentages: Record<'50-30-20' | '50-40-10', number> = {
        '50-30-20': 50,
        '50-40-10': 50,
      }
      setMandatoryExpensesPercentage(presetPercentages[selectedPresetType])
    } else if (customPercentages.mandatory !== mandatoryExpensesPercentage) {
      setMandatoryExpensesPercentage(customPercentages.mandatory)
    }
  }, [selectedPresetType, customPercentages])

  const totalIncome = useMemo(() => calculateIncomeTotal(data.incomes), [data.incomes])
  const totalSavings = useMemo(() => calculateSavingsTotal(data.savings), [data.savings])
  const totalExpenses = useMemo(() => calculateExpensesTotal(data.expenses), [data.expenses])
  const balance = useMemo(
    () =>
      calculateBalance(
        totalIncome,
        totalSavings,
        totalExpenses,
        data.tax,
        data.mandatoryExpenses
      ),
    [totalIncome, totalSavings, totalExpenses, data.tax, data.mandatoryExpenses]
  )

  const updateIncomeItem = (id: string, amount: number) => {
    setData((prev) => {
      const updatedIncomes = prev.incomes.map((item) => (item.id === id ? { ...item, amount } : item))
      const newData = { ...prev, incomes: updatedIncomes }
      
      // Debounced сохранение при изменении суммы
      saveFinancialDataDebounced(newData)
      
      return newData
    })
  }

  const addIncomeCategory = (name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        incomes: [...prev.incomes, { id: Date.now().toString(), name, amount: 0, icon: getCategoryIcon(name) }],
      }
      // Немедленное сохранение при добавлении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const removeIncomeCategory = (id: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        incomes: prev.incomes.filter((item) => item.id !== id),
      }
      // Немедленное сохранение при удалении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateIncomeCategoryName = (id: string, name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        incomes: prev.incomes.map((item) => (item.id === id ? { ...item, name } : item)),
      }
      // Немедленное сохранение при изменении названия
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateExchangeRate = (rate: number) => {
    setData((prev) => {
      const newData = {
        ...prev,
        exchangeRate: rate,
        savings: prev.savings.map((item) => ({
          ...item,
          amountUsd: calculateUsdAmount(item.amount, rate),
        })),
      }
      // Немедленное сохранение при изменении курса
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateSavingsItem = (id: string, amount: number, isCustom: boolean = true) => {
    setData((prev) => {
      const item = prev.savings.find((s) => s.id === id)
      // Не позволяем редактировать суммы у групп
      if (item?.isGroup) {
        return prev
      }
      
      const newSavings = prev.savings.map((item) =>
        item.id === id
          ? {
            ...item,
            amount,
            amountUsd: calculateUsdAmount(amount, prev.exchangeRate),
            isCustom,
          }
          : item
      )
      const newData = { ...prev, savings: newSavings }
      
      // Debounced сохранение при изменении суммы
      saveFinancialDataDebounced(newData)
      
      return newData
    })
  }

  const updateExpenseItem = (id: string, amount: number) => {
    setData((prev) => {
      const newExpenses = prev.expenses.map((item) => (item.id === id ? { ...item, amount } : item))
      const newData = { ...prev, expenses: newExpenses }
      
      // Debounced сохранение при изменении суммы
      saveFinancialDataDebounced(newData)
      
      return newData
    })
  }

  const updateTax = (tax: number) => {
    setData((prev) => {
      const newData = { ...prev, tax }
      // Немедленное сохранение
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateMandatoryExpenses = (mandatoryExpenses: number) => {
    setData((prev) => {
      const newData = { ...prev, mandatoryExpenses }
      // Немедленное сохранение
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const addSavingsCategory = (name: string, parentId?: string) => {
    setData((prev) => {
      const newItem: SavingsItem = {
        id: Date.now().toString(),
        name,
        amount: 0,
        amountUsd: 0,
        isCustom: true,
        icon: getCategoryIcon(name),
        isGroup: false,
        parentId: parentId || undefined,
      }
      const newData = {
        ...prev,
        savings: [...prev.savings, newItem],
      }
      // Немедленное сохранение при добавлении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const removeSavingsCategory = (id: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.filter((item) => item.id !== id),
      }
      // Немедленное сохранение при удалении
      saveFinancialDataImmediate(newData)
      return newData
    })
    // Удалить правила, связанные с этой копилкой
    setDistributionRules((prevRules) =>
      prevRules.map((rule) => ({
        ...rule,
        savingsItemIds: rule.savingsItemIds.filter((itemId) => itemId !== id),
      })).filter((rule) => rule.savingsItemIds.length > 0)
    )
  }

  const updateSavingsCategoryName = (id: string, name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.map((item) => (item.id === id ? { ...item, name } : item)),
      }
      // Немедленное сохранение при изменении названия
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const addExpenseCategory = (name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        expenses: [...prev.expenses, { id: Date.now().toString(), name, amount: 0, icon: getCategoryIcon(name) }],
      }
      // Немедленное сохранение при добавлении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const removeExpenseCategory = (id: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        expenses: prev.expenses.filter((item) => item.id !== id),
      }
      // Немедленное сохранение при удалении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateExpenseCategoryName = (id: string, name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        expenses: prev.expenses.map((item) =>
          item.id === id
            ? { ...item, name, icon: item.icon || getCategoryIcon(name) }
            : item
        ),
      }
      // Немедленное сохранение при изменении названия
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateIncomeIcon = (id: string, icon: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        incomes: prev.incomes.map((item) => (item.id === id ? { ...item, icon } : item)),
      }
      // Немедленное сохранение при изменении иконки
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateExpenseIcon = (id: string, icon: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        expenses: prev.expenses.map((item) => (item.id === id ? { ...item, icon } : item)),
      }
      // Немедленное сохранение при изменении иконки
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateSavingsIcon = (id: string, icon: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.map((item) => (item.id === id ? { ...item, icon } : item)),
      }
      // Немедленное сохранение при изменении иконки
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const reorderExpenses = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const newExpenses = [...prev.expenses]
      const [removed] = newExpenses.splice(fromIndex, 1)
      newExpenses.splice(toIndex, 0, removed)
      const newData = { ...prev, expenses: newExpenses }
      // Немедленное сохранение при изменении порядка
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const reorderSavings = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const newSavings = [...prev.savings]
      const [removed] = newSavings.splice(fromIndex, 1)
      newSavings.splice(toIndex, 0, removed)
      const newData = { ...prev, savings: newSavings }
      // Немедленное сохранение при изменении порядка
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const addDistributionRule = (rule: Omit<DistributionRule, 'id'>) => {
    const newRule: DistributionRule = {
      ...rule,
      id: Date.now().toString(),
    }
    setDistributionRules((prev) => [...prev, newRule])
  }

  const updateDistributionRule = (id: string, updates: Partial<DistributionRule>) => {
    setDistributionRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    )
  }

  const removeDistributionRule = (id: string) => {
    setDistributionRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  // Функция applyRules больше не используется - правила служат только как рекомендация
  // Суммы в копилках меняются только пользователем вручную
  const applyRules = (rules: DistributionRule[], mandatoryPercentage?: number) => {
    setDistributionRules(rules)
    if (mandatoryPercentage !== undefined) {
      setMandatoryExpensesPercentage(mandatoryPercentage)
    }
    // Не применяем правила автоматически - только обновляем процент обязательных расходов
  }

  // Ручное сохранение (для кнопки "Сохранить")
  const saveData = async () => {
    await saveFinancialDataImmediate(data)
  }

  // Вспомогательные функции для работы с группами
  const getSavingsChildren = (parentId: string) => {
    return data.savings.filter((item) => item.parentId === parentId)
  }

  const calculateGroupTotals = (groupId: string) => {
    const children = getSavingsChildren(groupId)
    const totalAmount = children.reduce((sum, child) => sum + child.amount, 0)
    const totalAmountUsd = children.reduce((sum, child) => sum + child.amountUsd, 0)
    return { totalAmount, totalAmountUsd }
  }

  // Создание новой группы
  const addSavingsGroup = (name: string) => {
    setData((prev) => {
      const newGroup: SavingsItem = {
        id: Date.now().toString(),
        name,
        amount: 0,
        amountUsd: 0,
        isCustom: true,
        icon: getCategoryIcon(name),
        isGroup: true,
        parentId: undefined,
      }
      const newData = {
        ...prev,
        savings: [...prev.savings, newGroup],
      }
      // Немедленное сохранение при добавлении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  // Конвертация обычной копилки в группу
  const convertSavingsToGroup = (id: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.map((item) =>
          item.id === id
            ? { ...item, isGroup: true, amount: 0, amountUsd: 0 }
            : item
        ),
      }
      // Немедленное сохранение при конвертации
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  // Конвертация группы обратно в обычную копилку
  const convertGroupToSavings = (id: string) => {
    setData((prev) => {
      // Перемещаем всех детей группы на верхний уровень
      const newSavings = prev.savings.map((item) => {
        if (item.id === id) {
          return { ...item, isGroup: false }
        }
        if (item.parentId === id) {
          return { ...item, parentId: undefined }
        }
        return item
      })
      const newData = { ...prev, savings: newSavings }
      // Немедленное сохранение при конвертации
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  // Перемещение копилки в группу или из группы
  const moveSavingsToGroup = (savingsId: string, groupId: string | null) => {
    setData((prev) => {
      const savingsItem = prev.savings.find((s) => s.id === savingsId)
      // Не позволяем перемещать группу в группу (только один уровень вложенности)
      if (savingsItem?.isGroup && groupId !== null) {
        return prev
      }
      
      const newData = {
        ...prev,
        savings: prev.savings.map((item) =>
          item.id === savingsId
            ? { ...item, parentId: groupId || undefined }
            : item
        ),
      }
      // Немедленное сохранение при перемещении
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  return {
    data,
    distributionRules,
    totalIncome,
    totalSavings,
    totalExpenses,
    balance,
    saving,
    saveData,
    updateIncomeItem,
    updateExchangeRate,
    updateSavingsItem,
    updateExpenseItem,
    updateTax,
    updateMandatoryExpenses,
    addIncomeCategory,
    removeIncomeCategory,
    updateIncomeCategoryName,
    addSavingsCategory,
    removeSavingsCategory,
    updateSavingsCategoryName,
    addExpenseCategory,
    removeExpenseCategory,
    updateExpenseCategoryName,
    updateIncomeIcon,
    updateExpenseIcon,
    updateSavingsIcon,
    reorderExpenses,
    reorderSavings,
    addDistributionRule,
    updateDistributionRule,
    removeDistributionRule,
    applyRules,
    mandatoryExpensesPercentage,
    selectedPresetType,
    setSelectedPresetType,
    customPercentages,
    setCustomPercentages,
    // Функции для работы с группами
    getSavingsChildren,
    calculateGroupTotals,
    addSavingsGroup,
    convertSavingsToGroup,
    convertGroupToSavings,
    moveSavingsToGroup,
  }
}

