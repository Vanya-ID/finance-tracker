import { supabase } from './supabase'
import { FinancialData, MonthlyReport, UserProfile, SavingsTransaction, DistributionRule, Transaction } from '../types'

type Settings = {
  selectedPresetType?: '50-30-20' | '50-40-10' | 'custom'
  mandatoryExpensesPercentage?: number
  exchangeRate?: number
  distributionRules?: DistributionRule[]
  customPercentages?: { mandatory: number; savings: number; remainder: number }
  selectedSavingsForStats?: string[]
}

// Функция getUserId не нужна, так как userId передается как параметр

// Сохранение финансовых данных (план)
export const saveFinancialData = async (userId: string, data: FinancialData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_financial_data')
      .upsert({
        user_id: userId,
        financial_data: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Ошибка сохранения финансовых данных:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка сохранения финансовых данных:', error)
    throw error
  }
}

// Загрузка финансовых данных
export const loadFinancialData = async (userId: string): Promise<FinancialData | null> => {
  try {
    const { data, error } = await supabase
      .from('user_financial_data')
      .select('financial_data')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена
        return null
      }
      console.error('Ошибка загрузки финансовых данных:', error)
      throw error
    }

    return data?.financial_data || null
  } catch (error) {
    console.error('Ошибка загрузки финансовых данных:', error)
    throw error
  }
}

// Сохранение профиля пользователя
export const saveProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Ошибка сохранения профиля:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка сохранения профиля:', error)
    throw error
  }
}

// Загрузка профиля пользователя
export const loadProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена
        return null
      }
      console.error('Ошибка загрузки профиля:', error)
      throw error
    }

    if (!data) {
      return null
    }

    return {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    throw error
  }
}

// Сохранение отчета за месяц
export const saveReport = async (userId: string, report: MonthlyReport): Promise<void> => {
  try {
    // Преобразуем createdAt в число, если это строка
    const createdAt = typeof report.createdAt === 'number'
      ? report.createdAt
      : new Date(report.createdAt).getTime()

    // Проверяем, является ли ID валидным UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }

    // Формируем объект для upsert
    const upsertData: any = {
      user_id: userId,
      year: report.year,
      month: report.month,
      plan: report.plan,
      actual: report.actual || null,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    }

    // Добавляем id только если это валидный UUID (для обновления существующего отчета)
    if (report.id && isValidUUID(report.id)) {
      upsertData.id = report.id
    }

    const { error } = await supabase
      .from('monthly_reports')
      .upsert(upsertData, {
        onConflict: 'user_id,year,month',
      })

    if (error) {
      console.error('Ошибка сохранения отчета:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка сохранения отчета:', error)
    throw error
  }
}

// Загрузка всех отчетов
export const loadAllReports = async (userId: string): Promise<MonthlyReport[]> => {
  try {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      console.error('Ошибка загрузки отчетов:', error)
      throw error
    }

    if (!data) {
      return []
    }

    return data.map((row: any) => ({
      id: row.id,
      year: row.year,
      month: row.month,
      plan: row.plan,
      actual: row.actual,
      createdAt: typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
    }))
  } catch (error) {
    console.error('Ошибка загрузки отчетов:', error)
    throw error
  }
}

// Удаление отчета за месяц
export const deleteReport = async (userId: string, year: number, month: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('monthly_reports')
      .delete()
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)

    if (error) {
      console.error('Ошибка удаления отчета:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка удаления отчета:', error)
    throw error
  }
}

// Сохранение настроек
export const saveSettings = async (userId: string, settings: Settings): Promise<void> => {
  try {
    // Загружаем существующие настройки
    const { data: existing } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single()

    const existingSettings = existing?.settings || {}
    const mergedSettings = { ...existingSettings, ...settings }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Ошибка сохранения настроек:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    throw error
  }
}

// Загрузка настроек
export const loadSettings = async (userId: string): Promise<Settings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена
        return null
      }
      console.error('Ошибка загрузки настроек:', error)
      throw error
    }

    return data?.settings || null
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
    throw error
  }
}

// Сохранение вычетов из копилок
export const saveSavingsWithdrawals = async (userId: string, withdrawals: SavingsTransaction[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('savings_withdrawals')
      .upsert({
        user_id: userId,
        withdrawals: withdrawals,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Ошибка сохранения вычетов из копилок:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка сохранения вычетов из копилок:', error)
    throw error
  }
}

// Загрузка вычетов из копилок
export const loadSavingsWithdrawals = async (userId: string): Promise<SavingsTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('savings_withdrawals')
      .select('withdrawals')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена
        return []
      }
      console.error('Ошибка загрузки вычетов из копилок:', error)
      throw error
    }

    return data?.withdrawals || []
  } catch (error) {
    console.error('Ошибка загрузки вычетов из копилок:', error)
    throw error
  }
}

// Транзакции (доходы/расходы)
export const createTransaction = async (userId: string, transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<Transaction> => {
  try {
    const createdAt = Date.now()

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: transaction.amount,
        category_id: transaction.categoryId,
        category_name: transaction.categoryName,
        type: transaction.type,
        date: transaction.date,
        created_at: createdAt,
        description: transaction.description || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Ошибка создания транзакции:', error)
      throw error
    }

    return {
      id: data.id,
      userId,
      amount: Number(data.amount),
      categoryId: data.category_id,
      categoryName: data.category_name,
      type: data.type,
      date: data.date,
      createdAt: typeof data.created_at === 'number' ? data.created_at : createdAt,
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
      description: data.description ?? undefined,
    }
  } catch (error) {
    console.error('Ошибка создания транзакции:', error)
    throw error
  }
}

export const loadTransactions = async (userId: string, fromDate?: number, toDate?: number): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (fromDate !== undefined) {
      query = query.gte('date', fromDate)
    }
    if (toDate !== undefined) {
      query = query.lte('date', toDate)
    }

    const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка загрузки транзакций:', error)
      throw error
    }

    if (!data) {
      return []
    }

    return data.map((row: any) => ({
      id: row.id,
      userId,
      amount: Number(row.amount),
      categoryId: row.category_id,
      categoryName: row.category_name,
      type: row.type,
      date: typeof row.date === 'number' ? row.date : new Date(row.date).getTime(),
      createdAt: typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
      description: row.description ?? undefined,
    }))
  } catch (error) {
    console.error('Ошибка загрузки транзакций:', error)
    throw error
  }
}

export const updateTransaction = async (userId: string, transaction: Transaction): Promise<void> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        amount: transaction.amount,
        category_id: transaction.categoryId,
        category_name: transaction.categoryName,
        type: transaction.type,
        date: transaction.date,
        description: transaction.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Ошибка обновления транзакции:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка обновления транзакции:', error)
    throw error
  }
}

export const deleteTransaction = async (userId: string, transactionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Ошибка удаления транзакции:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка удаления транзакции:', error)
    throw error
  }
}

