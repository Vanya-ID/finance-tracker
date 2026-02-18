import { useState, useEffect, useMemo } from 'react'
import { MonthlyReport, FinancialData, ActualFinancialData } from '../types'
import { useDatabase } from './useDatabase'
import { deleteReport as deleteReportFromDB } from '../services/supabaseDataService'

export const useReports = () => {
  const { saveReport: saveReportToDB, loadAllReports: loadAllReportsFromDB } = useDatabase()
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)

  // Загрузка отчетов из localStorage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const firebaseReports = await loadAllReportsFromDB()
        setReports(firebaseReports)
      } catch (error) {
        console.error('Ошибка загрузки отчетов:', error)
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [loadAllReportsFromDB])

  const createReport = (year: number, month: number, plan: FinancialData): MonthlyReport => {
    const report: MonthlyReport = {
      id: `${year}-${month}-${Date.now()}`,
      year,
      month,
      plan: JSON.parse(JSON.stringify(plan)), // Deep copy
      createdAt: Date.now(),
    }
    return report
  }

  const saveReport = async (report: MonthlyReport) => {
    try {
      await saveReportToDB(report)
      // Перезагружаем отчеты после сохранения
      const updatedReports = await loadAllReportsFromDB()
      setReports(updatedReports)
    } catch (error) {
      console.error('Ошибка сохранения отчета:', error)
      throw error
    }
  }

  const getReport = (year: number, month: number): MonthlyReport | undefined => {
    return reports.find((r) => r.year === year && r.month === month)
  }

  const updateReportActual = async (year: number, month: number, actual: ActualFinancialData, plan?: FinancialData) => {
    const report = getReport(year, month)
    if (report) {
      // Используем существующий отчет с его ID (UUID из БД)
      await saveReport({ ...report, actual })
    } else {
      // Создаем новый отчет с переданным планом или пустым планом
      // ID будет сгенерирован Supabase как UUID
      const reportPlan = plan || {
        incomes: [],
        exchangeRate: 3,
        savings: [],
        expenses: [],
        tax: 0,
        mandatoryExpenses: 0,
      }
      const newReport = createReport(year, month, reportPlan)
      const { id, ...reportWithoutId } = newReport
      await saveReport({ ...reportWithoutId, actual } as MonthlyReport)
    }
  }

  const updateReportPlan = async (year: number, month: number, plan: FinancialData) => {
    const report = getReport(year, month)
    if (report) {
      await saveReport({ ...report, plan: JSON.parse(JSON.stringify(plan)) })
    }
  }

  const getReportsByYear = (year: number): MonthlyReport[] => {
    return reports.filter((r) => r.year === year).sort((a, b) => a.month - b.month)
  }

  const getReportsByHalfYear = (year: number, halfYear: 1 | 2): MonthlyReport[] => {
    const startMonth = halfYear === 1 ? 1 : 7
    const endMonth = halfYear === 1 ? 6 : 12
    return reports
      .filter((r) => r.year === year && r.month >= startMonth && r.month <= endMonth)
      .sort((a, b) => a.month - b.month)
  }

  const deleteReport = async (id: string) => {
    try {
      const report = reports.find((r) => r.id === id)
      if (report) {
        await deleteReportFromDB(report.year, report.month)
        setReports((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error('Ошибка удаления отчета:', error)
      throw error
    }
  }

  const years = useMemo(() => {
    const uniqueYears = new Set(reports.map((r) => r.year))
    return Array.from(uniqueYears).sort((a, b) => b - a)
  }, [reports])

  return {
    reports,
    createReport,
    saveReport,
    getReport,
    updateReportActual,
    updateReportPlan,
    getReportsByYear,
    getReportsByHalfYear,
    deleteReport,
    years,
    loading,
  }
}


