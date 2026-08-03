import { useState, useMemo, useEffect } from 'react'
import { FinancialData, IncomeItem, SavingsItem } from '../types'
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
  const [mandatoryExpensesPercentage, setMandatoryExpensesPercentage] = useState<number>(50)
  const [selectedPresetType, setSelectedPresetType] = useState<'50-30-20' | '50-40-10' | 'custom'>('50-30-20')
  const [customPercentages, setCustomPercentages] = useState<{ mandatory: number; savings: number; remainder: number }>({ mandatory: 50, savings: 30, remainder: 20 })
  const [rulesEnabled, setRulesEnabled] = useState<boolean>(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Загрузка финансовых данных из хранилища
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      try {
        const storedData = await loadFinancialDataFromDB()
        if (!storedData) {
          setData(defaultFinancialData)
          return
        }

        // Убираем копилки, чья группа больше не существует
        const savings = storedData.savings ?? []
        const existingGroupIds = new Set(
          savings.filter((item) => item.isGroup).map((item) => item.id)
        )
        const cleanedSavings = savings.map((item) =>
          item.parentId && !existingGroupIds.has(item.parentId)
            ? { ...item, parentId: undefined }
            : item
        )

        setData({
          incomes: storedData.incomes ?? [],
          exchangeRate: storedData.exchangeRate ?? 3,
          savings: cleanedSavings,
          expenses: storedData.expenses ?? [],
          tax: storedData.tax ?? 0,
          mandatoryExpenses: storedData.mandatoryExpenses ?? 0,
        })
      } catch (error) {
        console.error('Ошибка загрузки финансовых данных:', error)
        setData(defaultFinancialData)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [loadFinancialDataFromDB])

  // Загрузка настроек из хранилища
  useEffect(() => {
    const loadSettingsData = async () => {
      setSettingsLoading(true)
      setIsInitialLoad(true)
      try {
        const storedSettings = await loadSettingsFromDB()
        if (storedSettings) {
          if (storedSettings.mandatoryExpensesPercentage !== undefined) {
            setMandatoryExpensesPercentage(storedSettings.mandatoryExpensesPercentage)
          }
          if (storedSettings.selectedPresetType) {
            setSelectedPresetType(storedSettings.selectedPresetType)
          }
          if (storedSettings.customPercentages) {
            setCustomPercentages(storedSettings.customPercentages)
          }
          if (storedSettings.rulesEnabled !== undefined) {
            setRulesEnabled(storedSettings.rulesEnabled)
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

  // Сохранение настроек (только после загрузки и только при реальных изменениях)
  useEffect(() => {
    if (!settingsLoading && !isInitialLoad) {
      saveSettingsDebounced({
        mandatoryExpensesPercentage,
        selectedPresetType,
        customPercentages,
      })
    }
  }, [mandatoryExpensesPercentage, selectedPresetType, customPercentages, settingsLoading, isInitialLoad, saveSettingsDebounced])

  useEffect(() => {
    // При смене пресета обновляем только процент обязательных расходов
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
    () => calculateBalance(totalIncome, totalSavings, totalExpenses, data.tax, data.mandatoryExpenses),
    [totalIncome, totalSavings, totalExpenses, data.tax, data.mandatoryExpenses]
  )

  const updateIncomeItem = (id: string, amount: number) => {
    setData((prev) => {
      const newData = {
        ...prev,
        incomes: prev.incomes.map((item) => (item.id === id ? { ...item, amount } : item)),
      }
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
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateSavingsItem = (id: string, amount: number, isCustom: boolean = true) => {
    setData((prev) => {
      // Не позволяем редактировать суммы у групп
      if (prev.savings.find((s) => s.id === id)?.isGroup) {
        return prev
      }

      const newData = {
        ...prev,
        savings: prev.savings.map((item) =>
          item.id === id
            ? {
              ...item,
              amount,
              amountUsd: calculateUsdAmount(amount, prev.exchangeRate),
              isCustom,
            }
            : item
        ),
      }
      saveFinancialDataDebounced(newData)
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
      const newData = { ...prev, savings: [...prev.savings, newItem] }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const removeSavingsCategory = (id: string, deleteChildren: boolean = false) => {
    setData((prev) => {
      const isGroup = prev.savings.find((item) => item.id === id)?.isGroup === true

      // Рекурсивная функция для поиска всех дочерних элементов
      const findAllChildren = (parentId: string, savingsList: SavingsItem[]): string[] => {
        const directChildren = savingsList
          .filter((item) => item.parentId === parentId)
          .map((item) => item.id)
        const nestedChildren = directChildren.flatMap((childId) => {
          const child = savingsList.find((item) => item.id === childId)
          return child?.isGroup ? findAllChildren(childId, savingsList) : []
        })
        return [...directChildren, ...nestedChildren]
      }

      let newSavings: SavingsItem[]

      if (isGroup && deleteChildren) {
        // Удаляем группу вместе со всеми вложенными копилками
        const allChildrenIds = new Set(findAllChildren(id, prev.savings))
        allChildrenIds.add(id)
        newSavings = prev.savings.filter((item) => !allChildrenIds.has(item.id))
      } else if (isGroup) {
        // Удаляем только группу, дочерние копилки выносим наверх
        newSavings = prev.savings
          .filter((item) => item.id !== id)
          .map((item) => (item.parentId === id ? { ...item, parentId: undefined } : item))
      } else {
        newSavings = prev.savings.filter((item) => item.id !== id)
      }

      const newData = { ...prev, savings: newSavings }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateSavingsCategoryName = (id: string, name: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.map((item) => (item.id === id ? { ...item, name } : item)),
      }
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
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const getSavingsChildren = (parentId: string) => {
    return data.savings.filter((item) => item.parentId === parentId)
  }

  const calculateGroupTotals = (groupId: string) => {
    const children = getSavingsChildren(groupId)
    return {
      totalAmount: children.reduce((sum, child) => sum + child.amount, 0),
      totalAmountUsd: children.reduce((sum, child) => sum + child.amountUsd, 0),
    }
  }

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
      const newData = { ...prev, savings: [...prev.savings, newGroup] }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const convertSavingsToGroup = (id: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        savings: prev.savings.map((item) =>
          item.id === id ? { ...item, isGroup: true, amount: 0, amountUsd: 0 } : item
        ),
      }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const convertGroupToSavings = (id: string) => {
    setData((prev) => {
      // Перемещаем всех детей группы на верхний уровень
      const newData = {
        ...prev,
        savings: prev.savings.map((item) => {
          if (item.id === id) {
            return { ...item, isGroup: false }
          }
          if (item.parentId === id) {
            return { ...item, parentId: undefined }
          }
          return item
        }),
      }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const moveSavingsToGroup = (savingsId: string, groupId: string | null) => {
    setData((prev) => {
      // Не позволяем перемещать группу в группу (только один уровень вложенности)
      if (prev.savings.find((s) => s.id === savingsId)?.isGroup && groupId !== null) {
        return prev
      }

      const newData = {
        ...prev,
        savings: prev.savings.map((item) =>
          item.id === savingsId ? { ...item, parentId: groupId || undefined } : item
        ),
      }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateExpenseItem = (id: string, amount: number) => {
    setData((prev) => {
      const newData = {
        ...prev,
        expenses: prev.expenses.map((item) => (item.id === id ? { ...item, amount } : item)),
      }
      saveFinancialDataDebounced(newData)
      return newData
    })
  }

  const updateTax = (tax: number) => {
    setData((prev) => {
      const newData = { ...prev, tax }
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  const updateMandatoryExpenses = (mandatoryExpenses: number) => {
    setData((prev) => {
      const newData = { ...prev, mandatoryExpenses }
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
      saveFinancialDataImmediate(newData)
      return newData
    })
  }

  // Ручное сохранение (для кнопки "Сохранить")
  const saveData = async () => {
    await saveFinancialDataImmediate(data)
  }

  return {
    data,
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
    updateSavingsIcon,
    reorderSavings,
    getSavingsChildren,
    calculateGroupTotals,
    addSavingsGroup,
    convertSavingsToGroup,
    convertGroupToSavings,
    moveSavingsToGroup,
    addExpenseCategory,
    removeExpenseCategory,
    updateExpenseCategoryName,
    updateIncomeIcon,
    updateExpenseIcon,
    reorderExpenses,
    mandatoryExpensesPercentage,
    selectedPresetType,
    setSelectedPresetType,
    customPercentages,
    setCustomPercentages,
    rulesEnabled,
  }
}
