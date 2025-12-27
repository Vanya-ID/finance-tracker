import React, { useState, useEffect, useMemo } from 'react'
import { useSavingsStats } from '../hooks/useSavingsStats'
import { useNotification } from '../contexts/NotificationContext'
import { useDatabase } from '../hooks/useDatabase'
import './SavingsStatsPage.css'

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

type SortType = 'name' | 'totalDeposited' | 'totalWithdrawn' | 'currentBalance' | 'none'
type SortDirection = 'asc' | 'desc'

export const SavingsStatsPage: React.FC = () => {
  const { stats, addWithdrawal, getTransactionsForSavings, deleteWithdrawal } = useSavingsStats()
  const { showNotification } = useNotification()
  const { saveSettingsImmediate, loadSettings: loadSettingsFromDB } = useDatabase()
  const [expandedSavings, setExpandedSavings] = useState<Set<string>>(new Set())
  const [selectedSavings, setSelectedSavings] = useState<Set<string>>(new Set())
  const [selectedSavingsLoading, setSelectedSavingsLoading] = useState(true)

  // Загрузка выбранных копилок из Firebase
  useEffect(() => {
    const loadSelectedSavings = async () => {
      setSelectedSavingsLoading(true)
      try {
        const firebaseSettings = await loadSettingsFromDB()
        if (firebaseSettings?.selectedSavingsForStats) {
          setSelectedSavings(new Set(firebaseSettings.selectedSavingsForStats))
        } else {
          setSelectedSavings(new Set())
        }
      } catch (error) {
        console.error('Ошибка загрузки выбранных копилок:', error)
        setSelectedSavings(new Set())
      } finally {
        setSelectedSavingsLoading(false)
      }
    }

    loadSelectedSavings()
  }, [loadSettingsFromDB])
  const [withdrawalModal, setWithdrawalModal] = useState<{ savingsId: string; savingsName: string } | null>(null)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalDescription, setWithdrawalDescription] = useState('')
  const [sortType, setSortType] = useState<SortType>('none')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleExpanded = (savingsId: string) => {
    setExpandedSavings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(savingsId)) {
        newSet.delete(savingsId)
      } else {
        newSet.add(savingsId)
      }
      return newSet
    })
  }

  const toggleSelected = async (savingsId: string) => {
    setSelectedSavings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(savingsId)) {
        newSet.delete(savingsId)
      } else {
        newSet.add(savingsId)
      }
      // Сохраняем в Firebase
      saveSettingsImmediate({ selectedSavingsForStats: Array.from(newSet) }).catch((error) => {
        console.error('Ошибка сохранения выбранных копилок:', error)
      })
      return newSet
    })
  }

  const selectAll = async () => {
    const allIds = new Set(stats.map((stat) => stat.savingsId))
    setSelectedSavings(allIds)
    try {
      await saveSettingsImmediate({ selectedSavingsForStats: Array.from(allIds) })
    } catch (error) {
      console.error('Ошибка сохранения выбранных копилок:', error)
    }
  }

  const deselectAll = async () => {
    setSelectedSavings(new Set())
    try {
      await saveSettingsImmediate({ selectedSavingsForStats: [] })
    } catch (error) {
      console.error('Ошибка сохранения выбранных копилок:', error)
    }
  }

  // Очищаем выбранные копилки, если они были удалены
  useEffect(() => {
    if (!selectedSavingsLoading) {
      const currentIds = new Set(stats.map((stat) => stat.savingsId))
      setSelectedSavings((prev) => {
        const filtered = Array.from(prev).filter((id) => currentIds.has(id))
        if (filtered.length !== prev.size) {
          saveSettingsImmediate({ selectedSavingsForStats: filtered }).catch((error) => {
            console.error('Ошибка сохранения выбранных копилок:', error)
          })
          return new Set(filtered)
        }
        return prev
      })
    }
  }, [stats, selectedSavingsLoading, saveSettingsImmediate])

  const handleOpenWithdrawalModal = (savingsId: string, savingsName: string) => {
    setWithdrawalModal({ savingsId, savingsName })
    setWithdrawalAmount('')
    setWithdrawalDescription('')
  }

  const handleCloseWithdrawalModal = () => {
    setWithdrawalModal(null)
    setWithdrawalAmount('')
    setWithdrawalDescription('')
  }

  const handleSubmitWithdrawal = () => {
    if (!withdrawalModal || !withdrawalAmount || Number(withdrawalAmount) <= 0) return

    addWithdrawal(
      withdrawalModal.savingsId,
      Number(withdrawalAmount),
      withdrawalDescription.trim() || undefined
    )
    showNotification(`Вычет ${Number(withdrawalAmount).toLocaleString('ru-RU')} Br добавлен в копилку "${withdrawalModal.savingsName}"`, 'success')
    handleCloseWithdrawalModal()
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMonthYear = (year: number, month: number) => {
    return `${monthNames[month - 1]} ${year}`
  }

  // Сортировка статистики
  const sortedStats = useMemo(() => {
    const result = [...stats]
    if (sortType !== 'none') {
      result.sort((a, b) => {
        let comparison = 0
        switch (sortType) {
          case 'name':
            comparison = a.savingsName.localeCompare(b.savingsName, 'ru')
            break
          case 'totalDeposited':
            comparison = a.totalDeposited - b.totalDeposited
            break
          case 'totalWithdrawn':
            comparison = a.totalWithdrawn - b.totalWithdrawn
            break
          case 'currentBalance':
            comparison = a.currentBalance - b.currentBalance
            break
          default:
            return 0
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    return result
  }, [stats, sortType, sortDirection])

  const totalStats = stats.reduce(
    (acc, stat) => ({
      totalDeposited: acc.totalDeposited + stat.totalDeposited,
      totalWithdrawn: acc.totalWithdrawn + stat.totalWithdrawn,
      currentBalance: acc.currentBalance + stat.currentBalance,
    }),
    { totalDeposited: 0, totalWithdrawn: 0, currentBalance: 0 }
  )

  // Статистика по выбранным копилкам
  const selectedStats = stats
    .filter((stat) => selectedSavings.has(stat.savingsId))
    .reduce(
      (acc, stat) => ({
        totalDeposited: acc.totalDeposited + stat.totalDeposited,
        totalWithdrawn: acc.totalWithdrawn + stat.totalWithdrawn,
        currentBalance: acc.currentBalance + stat.currentBalance,
        count: acc.count + 1,
      }),
      { totalDeposited: 0, totalWithdrawn: 0, currentBalance: 0, count: 0 }
    )

  return (
    <div className="savings-stats-page">
      <div className="savings-stats-header">
        <h1>📊 Статистика копилок</h1>
        <p className="stats-description">
          Здесь вы можете увидеть все операции с копилками: пополнения из месячных отчетов и вычеты.
          <br />
          <strong>Как это работает:</strong> Пополнения автоматически собираются из фактических данных отчетов за каждый месяц (или из плана, если фактические данные не введены). 
          Все суммы суммируются по всем месяцам для каждой копилки.
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="empty-state">
          <p>Нет данных по копилкам. Создайте копилки в разделе "План" и добавляйте фактические данные в отчетах.</p>
        </div>
      ) : (
        <>
          {/* Общая статистика */}
          <div className="total-stats">
            <div className="total-stat-item">
              <span className="total-stat-label">Всего отложено:</span>
              <span className="total-stat-value positive">{totalStats.totalDeposited.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="total-stat-item">
              <span className="total-stat-label">Всего вычтено:</span>
              <span className="total-stat-value negative">{totalStats.totalWithdrawn.toLocaleString('ru-RU')} Br</span>
            </div>
            <div className="total-stat-item">
              <span className="total-stat-label">Текущий баланс:</span>
              <span className={`total-stat-value ${totalStats.currentBalance >= 0 ? 'positive' : 'negative'}`}>
                {totalStats.currentBalance.toLocaleString('ru-RU')} Br
              </span>
            </div>
          </div>

          {/* Статистика по выбранным копилкам */}
          {selectedSavings.size > 0 && (
            <div className="selected-stats-section">
              <div className="selected-stats-header">
                <h2>💰 Итоговая сумма выбранных копилок ({selectedStats.count})</h2>
                <div className="selected-stats-actions">
                  <button className="btn-select-all" onClick={deselectAll}>
                    Снять выбор
                  </button>
                </div>
              </div>
              <div className="total-stats selected">
                <div className="total-stat-item">
                  <span className="total-stat-label">Отложено:</span>
                  <span className="total-stat-value positive">{selectedStats.totalDeposited.toLocaleString('ru-RU')} Br</span>
                </div>
                <div className="total-stat-item">
                  <span className="total-stat-label">Вычтено:</span>
                  <span className="total-stat-value negative">{selectedStats.totalWithdrawn.toLocaleString('ru-RU')} Br</span>
                </div>
                <div className="total-stat-item">
                  <span className="total-stat-label">Баланс:</span>
                  <span className={`total-stat-value ${selectedStats.currentBalance >= 0 ? 'positive' : 'negative'}`}>
                    {selectedStats.currentBalance.toLocaleString('ru-RU')} Br
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки выбора и сортировка */}
          {stats.length > 0 && (
            <div className="controls-section">
              <div className="selection-controls">
                <button className="btn-select-all" onClick={selectAll}>
                  Выбрать все
                </button>
                {selectedSavings.size > 0 && (
                  <button className="btn-deselect-all" onClick={deselectAll}>
                    Снять выбор
                  </button>
                )}
              </div>
              <div className="sort-controls">
                <label htmlFor="savings-stats-sort">Сортировка:</label>
                <select
                  id="savings-stats-sort"
                  value={sortType === 'none' ? '' : `${sortType}-${sortDirection}`}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setSortType('none')
                    } else {
                      const [type, direction] = e.target.value.split('-')
                      setSortType(type as SortType)
                      setSortDirection(direction as SortDirection)
                    }
                  }}
                  className="savings-stats-sort-select"
                >
                  <option value="">Без сортировки</option>
                  <option value="name-asc">По названию (А-Я)</option>
                  <option value="name-desc">По названию (Я-А)</option>
                  <option value="totalDeposited-asc">По отложено (возрастание)</option>
                  <option value="totalDeposited-desc">По отложено (убывание)</option>
                  <option value="totalWithdrawn-asc">По вычтено (возрастание)</option>
                  <option value="totalWithdrawn-desc">По вычтено (убывание)</option>
                  <option value="currentBalance-asc">По балансу (возрастание)</option>
                  <option value="currentBalance-desc">По балансу (убывание)</option>
                </select>
              </div>
            </div>
          )}

          {/* Статистика по каждой копилке */}
          <div className="savings-stats-list">
            {sortedStats.map((stat) => {
              const transactions = getTransactionsForSavings(stat.savingsId)
              const isExpanded = expandedSavings.has(stat.savingsId)

              return (
                <div key={stat.savingsId} className={`savings-stat-card ${selectedSavings.has(stat.savingsId) ? 'selected' : ''}`}>
                  <div className="savings-stat-header">
                    <div className="savings-stat-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSavings.has(stat.savingsId)}
                        onChange={() => toggleSelected(stat.savingsId)}
                        title="Выбрать копилку"
                      />
                    </div>
                    <div className="savings-stat-info">
                      <span className="savings-icon">{stat.icon || '💰'}</span>
                      <div className="savings-info-text">
                        <h3 className="savings-name">{stat.savingsName}</h3>
                        <div className="savings-stats-row">
                          <div className="savings-stat-mini">
                            <span className="mini-label">Отложено:</span>
                            <span className="mini-value positive">{stat.totalDeposited.toLocaleString('ru-RU')} Br</span>
                          </div>
                          <div className="savings-stat-mini">
                            <span className="mini-label">Вычтено:</span>
                            <span className="mini-value negative">{stat.totalWithdrawn.toLocaleString('ru-RU')} Br</span>
                          </div>
                          <div className="savings-stat-mini">
                            <span className="mini-label">Баланс:</span>
                            <span className={`mini-value ${stat.currentBalance >= 0 ? 'positive' : 'negative'}`}>
                              {stat.currentBalance.toLocaleString('ru-RU')} Br
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="savings-stat-actions">
                      <button
                        className="btn-withdrawal"
                        onClick={() => handleOpenWithdrawalModal(stat.savingsId, stat.savingsName)}
                        title="Добавить вычет"
                      >
                        ➖ Вычет
                      </button>
                      {transactions.length > 0 && (
                        <button
                          className="btn-toggle-history"
                          onClick={() => toggleExpanded(stat.savingsId)}
                          title={isExpanded ? 'Скрыть историю' : 'Показать историю'}
                        >
                          {isExpanded ? '▲ История' : '▼ История'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && transactions.length > 0 && (
                    <div className="transactions-list">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Дата</th>
                            <th>Месяц</th>
                            <th>Тип</th>
                            <th>Сумма</th>
                            <th>Описание</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td>{formatDate(transaction.createdAt)}</td>
                              <td>{formatMonthYear(transaction.year, transaction.month)}</td>
                              <td>
                                <span className={`transaction-type ${transaction.type}`}>
                                  {transaction.type === 'deposit' ? '➕ Пополнение' : '➖ Вычет'}
                                </span>
                              </td>
                              <td className={transaction.type === 'deposit' ? 'positive' : 'negative'}>
                                {transaction.type === 'deposit' ? '+' : '-'}
                                {Math.abs(transaction.amount).toLocaleString('ru-RU')} Br
                              </td>
                              <td>{transaction.description || '-'}</td>
                              <td>
                                {transaction.type === 'withdrawal' && (
                                  <button
                                    className="btn-delete-transaction"
                                    onClick={() => {
                                      deleteWithdrawal(transaction.id)
                                      showNotification('Вычет удален', 'success')
                                    }}
                                    title="Удалить вычет"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Модальное окно для вычета */}
      {withdrawalModal && (
        <div className="modal-overlay" onClick={handleCloseWithdrawalModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Вычет из копилки "{withdrawalModal.savingsName}"</h2>
              <button className="modal-close" onClick={handleCloseWithdrawalModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="withdrawal-amount">Сумма (Br):</label>
                <input
                  id="withdrawal-amount"
                  type="number"
                  step="1"
                  min="1"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="withdrawal-description">Описание (необязательно):</label>
                <input
                  id="withdrawal-description"
                  type="text"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                  placeholder="Например: Покупка техники"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseWithdrawalModal}>
                Отмена
              </button>
              <button
                className="btn-submit"
                onClick={handleSubmitWithdrawal}
                disabled={!withdrawalAmount || Number(withdrawalAmount) <= 0}
              >
                Добавить вычет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

