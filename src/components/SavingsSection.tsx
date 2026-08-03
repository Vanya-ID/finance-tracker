import React, { useState, useMemo } from 'react'
import { SavingsItem } from '../types'
import { IconPicker } from './IconPicker'
import { DeleteGroupModal } from './DeleteGroupModal'
import { getCategoryIcon } from '../utils/iconUtils'
import './SavingsSection.css'

interface SavingsSectionProps {
  savings: SavingsItem[]
  exchangeRate: number
  availableAmount: number
  savingsPercentage: number
  totalIncome: number
  onSavingsChange: (id: string, amount: number, isCustom: boolean) => void
  onExchangeRateChange: (rate: number) => void
  onAddCategory: (name: string, parentId?: string) => void
  onRemoveCategory: (id: string, deleteChildren?: boolean) => void
  onCategoryNameChange: (id: string, name: string) => void
  onSavingsIconChange: (id: string, icon: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  // Новые props для работы с группами
  onAddGroup?: (name: string) => void
  onConvertToGroup?: (id: string) => void
  onConvertToSavings?: (id: string) => void
  onMoveToGroup?: (savingsId: string, groupId: string | null) => void
  getSavingsChildren?: (parentId: string) => SavingsItem[]
  calculateGroupTotals?: (groupId: string) => { totalAmount: number; totalAmountUsd: number }
}

type SortType = 'name' | 'amount' | 'percentage' | 'none'
type SortDirection = 'asc' | 'desc'

export const SavingsSection: React.FC<SavingsSectionProps> = ({
  savings,
  exchangeRate,
  availableAmount,
  savingsPercentage,
  totalIncome,
  onSavingsChange,
  onExchangeRateChange,
  onAddCategory,
  onRemoveCategory,
  onCategoryNameChange,
  onSavingsIconChange,
  onReorder,
  isCollapsed = false,
  onToggleCollapse,
  onAddGroup,
  onConvertToGroup,
  onConvertToSavings,
  onMoveToGroup,
  getSavingsChildren,
  calculateGroupTotals,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null)
  const [newChildName, setNewChildName] = useState('')
  const [editingName, setEditingName] = useState('')
  const [iconPickerId, setIconPickerId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [sortType, setSortType] = useState<SortType>('none')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [deleteGroupModal, setDeleteGroupModal] = useState<{ id: string; name: string; childrenCount: number } | null>(null)

  // Закрываем контекстное меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuId) {
        const target = e.target as HTMLElement
        if (!target.closest('.context-menu') && !target.closest('.context-menu-btn')) {
          setContextMenuId(null)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [contextMenuId])

  // Вычисляем суммы только для обычных копилок (не групп) и их дочерних элементов
  // Исключаем дочерние элементы (с parentId), чтобы не считать их дважды
  const total = savings.reduce((sum, item) => {
    // Пропускаем дочерние элементы - они уже учтены в сумме группы
    if (item.parentId) {
      return sum
    }
    if (item.isGroup) {
      // Для групп берем сумму дочерних элементов
      if (calculateGroupTotals) {
        const { totalAmount } = calculateGroupTotals(item.id)
        return sum + Math.round(totalAmount)
      }
      return sum
    }
    return sum + Math.round(item.amount)
  }, 0)

  const totalUsd = savings.reduce((sum, item) => {
    // Пропускаем дочерние элементы - они уже учтены в сумме группы
    if (item.parentId) {
      return sum
    }
    if (item.isGroup) {
      // Для групп берем сумму дочерних элементов
      if (calculateGroupTotals) {
        const { totalAmountUsd } = calculateGroupTotals(item.id)
        return sum + totalAmountUsd
      }
      return sum
    }
    return sum + item.amountUsd
  }, 0)

  const availableForSavings = savingsPercentage > 0 ? Math.round(totalIncome * savingsPercentage / 100) : availableAmount
  const availablePercentage = savingsPercentage > 0 ? savingsPercentage : (totalIncome > 0 ? (availableAmount / totalIncome) * 100 : 0)
  const totalPercentage = totalIncome > 0
    ? savings.reduce((sum, item) => {
      // Пропускаем дочерние элементы - они уже учтены в сумме группы
      if (item.parentId) {
        return sum
      }
      if (item.isGroup && calculateGroupTotals) {
        const { totalAmount } = calculateGroupTotals(item.id)
        return sum + (Math.round(totalAmount) / totalIncome * 100)
      }
      return sum + (Math.round(item.amount) / totalIncome * 100)
    }, 0)
    : 0
  const isOverBudget = total > availableForSavings
  const overBudgetAmount = isOverBudget ? total - availableForSavings : 0

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim())
      setNewCategoryName('')
    }
  }

  const handleAddGroup = () => {
    if (newGroupName.trim() && onAddGroup) {
      onAddGroup(newGroupName.trim())
      setNewGroupName('')
    }
  }

  const handleAddChildToGroup = (groupId: string) => {
    if (newChildName.trim()) {
      onAddCategory(newChildName.trim(), groupId)
      setNewChildName('')
      setAddingToGroupId(null)
      // Автоматически разворачиваем группу, чтобы показать новую копилку
      setCollapsedGroups((prev) => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onCategoryNameChange(id, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const filteredAndSortedSavings = useMemo(() => {
    // Получаем элементы верхнего уровня (без родителя) и осиротевшие копилки (у которых родитель не существует)
    const existingGroupIds = new Set(savings.filter((item) => item.isGroup).map((item) => item.id))
    let topLevelItems = savings.filter((item) => {
      // Показываем элементы без родителя
      if (!item.parentId) return true
      // Показываем элементы с parentId, у которых родительской группы не существует (осиротевшие)
      if (item.parentId && !existingGroupIds.has(item.parentId)) return true
      return false
    })

    // Фильтрация по названию
    if (filterText.trim()) {
      topLevelItems = topLevelItems.filter((saving) =>
        saving.name.toLowerCase().includes(filterText.toLowerCase().trim())
      )
    }

    // Сортировка
    if (sortType !== 'none') {
      topLevelItems.sort((a, b) => {
        let comparison = 0

        switch (sortType) {
          case 'name':
            comparison = a.name.localeCompare(b.name, 'ru')
            break
          case 'amount':
            // Для групп используем сумму дочерних элементов
            const aAmount = a.isGroup && calculateGroupTotals
              ? calculateGroupTotals(a.id).totalAmount
              : a.amount
            const bAmount = b.isGroup && calculateGroupTotals
              ? calculateGroupTotals(b.id).totalAmount
              : b.amount
            comparison = aAmount - bAmount
            break
          case 'percentage':
            const aAmount2 = a.isGroup && calculateGroupTotals
              ? calculateGroupTotals(a.id).totalAmount
              : a.amount
            const bAmount2 = b.isGroup && calculateGroupTotals
              ? calculateGroupTotals(b.id).totalAmount
              : b.amount
            const aPercent = totalIncome > 0 ? (aAmount2 / totalIncome) * 100 : 0
            const bPercent = totalIncome > 0 ? (bAmount2 / totalIncome) * 100 : 0
            comparison = aPercent - bPercent
            break
        }

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    // Создаем плоский список с дочерними элементами
    const flatList: SavingsItem[] = []
    topLevelItems.forEach((item) => {
      flatList.push(item)
      // Если это группа и она не свернута, добавляем дочерние элементы
      // Также проверяем, что группа действительно существует в списке
      if (item.isGroup && !collapsedGroups.has(item.id) && getSavingsChildren && existingGroupIds.has(item.id)) {
        const children = getSavingsChildren(item.id)
        // Фильтруем дочерние элементы, если есть фильтр
        const filteredChildren = filterText.trim()
          ? children.filter((child) =>
            child.name.toLowerCase().includes(filterText.toLowerCase().trim())
          )
          : children
        flatList.push(...filteredChildren)
      }
    })

    return flatList
  }, [savings, filterText, sortType, sortDirection, totalIncome, collapsedGroups, getSavingsChildren, calculateGroupTotals])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const draggedItem = filteredAndSortedSavings[draggedIndex]
      const dropItem = filteredAndSortedSavings[dropIndex]

      // Если перетаскиваем на группу, перемещаем внутрь группы
      if (dropItem.isGroup && !draggedItem.isGroup && onMoveToGroup) {
        onMoveToGroup(draggedItem.id, dropItem.id)
      } else {
        // Обычная перестановка
        const originalIndex = savings.findIndex((s) => s.id === draggedItem.id)
        const targetIndex = savings.findIndex((s) => s.id === dropItem.id)
        if (originalIndex !== -1 && targetIndex !== -1) {
          onReorder(originalIndex, targetIndex)
          // Сбрасываем сортировку после перестановки, чтобы показать новый порядок
          setSortType('none')
        }
      }
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }


  return (
    <div className="savings-section">
      <div className="savings-header">
        <div className="section-header" onClick={onToggleCollapse}>
          <h2 className="section-title">
            <span className="section-icon">🐷</span>
            Копилка
          </h2>
          {onToggleCollapse && (
            <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className={`available-amount-info ${isOverBudget ? 'warning' : ''}`}>
            <span className="available-label">
              {savingsPercentage > 0 ? 'Доступно для копилок:' : 'Свободно после расходов:'}
            </span>
            <span className="available-value">{availableForSavings.toLocaleString('ru-RU')} Br</span>
            <span className="available-percentage">({availablePercentage.toFixed(1)}% от дохода)</span>
            {isOverBudget && (
              <span className="warning-message">
                ⚠️ Превышение на {overBudgetAmount.toLocaleString('ru-RU')} Br
              </span>
            )}
          </div>
        )}
        {!isCollapsed && (
          <div className="savings-header-right">
            <div className="exchange-rate">
              <label>Курс $:</label>
              <input
                type="number"
                step="0.1"
                value={exchangeRate}
                onChange={(e) => onExchangeRateChange(Number(e.target.value))}
                className="exchange-input"
              />
            </div>
            <div className="add-category-section">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Новая копилка"
                className="category-name-input"
              />
              <button onClick={handleAddCategory} className="add-category-btn">
                + Копилка
              </button>
              {onAddGroup && (
                <>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                    placeholder="Новая группа"
                    className="category-name-input"
                  />
                  <button onClick={handleAddGroup} className="add-group-btn">
                    + Группа
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {!isCollapsed && (
          <div className="savings-filters">
            <div className="filter-group">
              <label className="filter-label">🔍 Поиск:</label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="По названию..."
                className="savings-filter-input"
              />
            </div>
            <div className="sort-group">
              <label className="filter-label">📊 Сортировка:</label>
              <select
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
                className="savings-sort-select"
              >
                <option value="">Без сортировки</option>
                <option value="name-asc">Название ↑ (А-Я)</option>
                <option value="name-desc">Название ↓ (Я-А)</option>
                <option value="amount-asc">Сумма ↑ (Меньше → Больше)</option>
                <option value="amount-desc">Сумма ↓ (Больше → Меньше)</option>
                <option value="percentage-asc">Процент ↑ (Меньше → Больше)</option>
                <option value="percentage-desc">Процент ↓ (Больше → Меньше)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="savings-table">
          <div className="savings-row header">
            <div className="savings-cell name">Название</div>
            <div className="savings-cell amount">Сумма (Br)</div>
            <div className="savings-cell amount-usd">В $</div>
            <div className="savings-cell percentage">%</div>
            <div className="savings-cell actions"></div>
          </div>

          {filteredAndSortedSavings.map((item, index) => {
            const isGroup = item.isGroup === true
            const isChild = item.parentId !== undefined
            const isGroupCollapsed = isGroup && collapsedGroups.has(item.id)
            const groupTotals = isGroup && calculateGroupTotals ? calculateGroupTotals(item.id) : null
            const displayAmount = isGroup && groupTotals ? Math.round(groupTotals.totalAmount) : Math.round(item.amount)
            const displayAmountUsd = isGroup && groupTotals ? groupTotals.totalAmountUsd : item.amountUsd

            return (
              <React.Fragment key={item.id}>
                <div
                  className={`savings-row ${isGroup ? 'group' : ''} ${isChild ? 'child' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${item.isGroup && dragOverIndex === index ? 'drag-over-group' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="savings-cell name">
                    {isGroup && (
                      <button
                        className="group-toggle"
                        onClick={() => toggleGroupCollapse(item.id)}
                        title={isGroupCollapsed ? 'Развернуть' : 'Свернуть'}
                      >
                        {isGroupCollapsed ? '▶' : '▼'}
                      </button>
                    )}
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={() => handleSaveEdit(item.id)}
                        className="savings-name-edit"
                        autoFocus
                      />
                    ) : (
                      <span
                        onDoubleClick={() => handleStartEdit(item.id, item.name)}
                        title="Двойной клик для редактирования"
                        className="savings-name-text"
                      >
                        <span
                          className="category-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIconPickerId(item.id)
                          }}
                          title="Изменить иконку"
                        >
                          {item.icon || getCategoryIcon(item.name)}
                        </span>
                        {item.name}
                        {isGroup && <span className="group-badge">группа</span>}
                      </span>
                    )}
                  </div>
                  <div className="savings-cell amount" data-label="Сумма (Br):">
                    {isGroup ? (
                      <span className="group-total">{displayAmount.toLocaleString('ru-RU')} Br</span>
                    ) : (
                      <input
                        type="number"
                        step="1"
                        value={displayAmount}
                        onChange={(e) => onSavingsChange(item.id, Math.round(Number(e.target.value) || 0), true)}
                        className="savings-input"
                      />
                    )}
                  </div>
                  <div className="savings-cell amount-usd" data-label="В $:">
                    {displayAmountUsd.toFixed(2)} $
                  </div>
                  <div className="savings-cell percentage" data-label="%:">
                    {displayAmount > 0 && totalIncome > 0
                      ? `${((displayAmount / totalIncome) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                  <div className="savings-cell actions">
                    <span className="drag-handle" title="Перетащите для изменения порядка">
                      ⋮⋮
                    </span>
                    {isGroup && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAddingToGroupId(addingToGroupId === item.id ? null : item.id)
                          if (addingToGroupId !== item.id) {
                            setNewChildName('')
                          }
                        }}
                        className="add-to-group-btn"
                        title="Добавить копилку в группу"
                      >
                        +
                      </button>
                    )}
                    {isChild && onMoveToGroup && (
                      <button
                        onClick={() => onMoveToGroup(item.id, null)}
                        className="move-out-btn"
                        title="Переместить из группы"
                      >
                        ↑
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setContextMenuId(contextMenuId === item.id ? null : item.id)
                      }}
                      className="context-menu-btn"
                      title="Действия"
                    >
                      ⋯
                    </button>
                    {contextMenuId === item.id && (
                      <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                        {!isGroup && onConvertToGroup && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onConvertToGroup(item.id)
                              setContextMenuId(null)
                            }}
                            className="context-menu-item"
                          >
                            Преобразовать в группу
                          </button>
                        )}
                        {isGroup && onConvertToSavings && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onConvertToSavings(item.id)
                              setContextMenuId(null)
                            }}
                            className="context-menu-item"
                          >
                            Разгруппировать
                          </button>
                        )}
                        {!isGroup && isChild && onMoveToGroup && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveToGroup(item.id, null)
                              setContextMenuId(null)
                            }}
                            className="context-menu-item"
                          >
                            ↑ Переместить на верхний уровень
                          </button>
                        )}
                        {!isGroup && !isChild && onMoveToGroup && savings.filter(s => s.isGroup && !s.parentId).length > 0 && (
                          <>
                            <div className="context-menu-divider"></div>
                            <div className="context-menu-label">Переместить в группу:</div>
                            {savings.filter(s => s.isGroup && !s.parentId).map(group => (
                              <button
                                key={group.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMoveToGroup(item.id, group.id)
                                  setContextMenuId(null)
                                }}
                                className="context-menu-item indent"
                              >
                                📁 {group.name}
                              </button>
                            ))}
                          </>
                        )}
                        {!isGroup && isChild && onMoveToGroup && (
                          <>
                            <div className="context-menu-divider"></div>
                            <div className="context-menu-label">Переместить в другую группу:</div>
                            {savings.filter(s => s.isGroup && !s.parentId && s.id !== item.parentId).map(group => (
                              <button
                                key={group.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMoveToGroup(item.id, group.id)
                                  setContextMenuId(null)
                                }}
                                className="context-menu-item indent"
                              >
                                📁 {group.name}
                              </button>
                            ))}
                          </>
                        )}
                        <div className="context-menu-divider"></div>
                        {!isGroup && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveCategory(item.id)
                              setContextMenuId(null)
                            }}
                            className="context-menu-item danger"
                          >
                            Удалить
                          </button>
                        )}
                        {isGroup && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const children = getSavingsChildren ? getSavingsChildren(item.id) : []
                              setDeleteGroupModal({
                                id: item.id,
                                name: item.name,
                                childrenCount: children.length,
                              })
                              setContextMenuId(null)
                            }}
                            className="context-menu-item danger"
                          >
                            Удалить группу
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Форма добавления дочерней копилки */}
                {isGroup && addingToGroupId === item.id && (
                  <div className="add-child-form">
                    <div className="add-child-form-content">
                      <span className="add-child-icon">📌</span>
                      <input
                        type="text"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddChildToGroup(item.id)
                          if (e.key === 'Escape') setAddingToGroupId(null)
                        }}
                        placeholder={`Новая копилка в "${item.name}"`}
                        className="add-child-input"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddChildToGroup(item.id)}
                        className="add-child-submit"
                        disabled={!newChildName.trim()}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setAddingToGroupId(null)
                          setNewChildName('')
                        }}
                        className="add-child-cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}

          <div className="savings-row total">
            <div className="savings-cell name">Итог</div>
            <div className="savings-cell amount" data-label="Сумма (Br):">{total.toLocaleString('ru-RU')} Br</div>
            <div className="savings-cell amount-usd" data-label="В $:">{totalUsd.toFixed(2)} $</div>
            <div className="savings-cell percentage" data-label="%:">{totalPercentage.toFixed(1)}%</div>
            <div className="savings-cell actions"></div>
          </div>
        </div>
      )}
      {iconPickerId && (
        <IconPicker
          currentIcon={savings.find(s => s.id === iconPickerId)?.icon}
          onSelect={(icon: string) => {
            onSavingsIconChange(iconPickerId, icon)
            setIconPickerId(null)
          }}
          onClose={() => setIconPickerId(null)}
        />
      )}
      {deleteGroupModal && (
        <DeleteGroupModal
          groupName={deleteGroupModal.name}
          childrenCount={deleteGroupModal.childrenCount}
          onDeleteWithChildren={() => {
            onRemoveCategory(deleteGroupModal.id, true)
            setDeleteGroupModal(null)
          }}
          onDeleteGroupOnly={() => {
            onRemoveCategory(deleteGroupModal.id, false)
            setDeleteGroupModal(null)
          }}
          onCancel={() => setDeleteGroupModal(null)}
        />
      )}
    </div>
  )
}

