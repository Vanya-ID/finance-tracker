import React, { useState } from 'react'
import { useFinancialData } from '../hooks/useFinancialData'
import { useNotification } from '../contexts/NotificationContext'
import { FinancialSummary } from '../components/FinancialSummary'
import { IncomeSection } from '../components/IncomeSection'
import { SavingsSection } from '../components/SavingsSection'
import { ExpensesSection } from '../components/ExpensesSection'
import { DistributionRules } from '../components/DistributionRules'
import './PlanPage.css'

export const PlanPage: React.FC = () => {
  const { showNotification } = useNotification()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    income: false,
    summary: false,
    rules: false,
    savings: false,
    expenses: false,
  })

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const {
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
  } = useFinancialData()

  const effectiveMandatoryPercentage = rulesEnabled ? mandatoryExpensesPercentage : 0
  const effectiveSavingsPercentage = rulesEnabled
    ? (selectedPresetType === '50-30-20' ? 30 : selectedPresetType === '50-40-10' ? 40 : customPercentages.savings)
    : 0

  const handleSave = async () => {
    try {
      await saveData()
      showNotification('Данные успешно сохранены', 'success')
    } catch (error) {
      showNotification('Ошибка при сохранении данных', 'error')
    }
  }

  return (
    <div className="plan-page">
      <div className="plan-page-header">
        <h1>Финансовый план</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="save-button"
          title="Сохранить изменения вручную"
        >
          {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
        </button>
      </div>
      <IncomeSection
        incomes={data.incomes}
        onIncomeChange={updateIncomeItem}
        onAddIncome={addIncomeCategory}
        onRemoveIncome={removeIncomeCategory}
        onIncomeNameChange={updateIncomeCategoryName}
        onIncomeIconChange={updateIncomeIcon}
        isCollapsed={collapsedSections.income}
        onToggleCollapse={() => toggleSection('income')}
      />

      {rulesEnabled && (
        <DistributionRules
          selectedPresetType={selectedPresetType}
          onPresetChange={setSelectedPresetType}
          customPercentages={customPercentages}
          onCustomPercentagesChange={setCustomPercentages}
          isCollapsed={collapsedSections.rules}
          onToggleCollapse={() => toggleSection('rules')}
        />
      )}

      <FinancialSummary
        totalIncome={totalIncome}
        totalSavings={totalSavings}
        mandatoryExpenses={data.mandatoryExpenses}
        totalExpenses={totalExpenses}
        tax={data.tax}
        balance={balance}
        mandatoryExpensesPercentage={effectiveMandatoryPercentage}
        onMandatoryExpensesChange={updateMandatoryExpenses}
        onTaxChange={updateTax}
        isCollapsed={collapsedSections.summary}
        onToggleCollapse={() => toggleSection('summary')}
      />

      <SavingsSection
        savings={data.savings}
        exchangeRate={data.exchangeRate}
        availableAmount={totalIncome - totalExpenses - data.mandatoryExpenses - data.tax}
        savingsPercentage={effectiveSavingsPercentage}
        totalIncome={totalIncome}
        onSavingsChange={updateSavingsItem}
        onExchangeRateChange={updateExchangeRate}
        onAddCategory={addSavingsCategory}
        onRemoveCategory={removeSavingsCategory}
        onCategoryNameChange={updateSavingsCategoryName}
        onSavingsIconChange={updateSavingsIcon}
        onReorder={reorderSavings}
        isCollapsed={collapsedSections.savings}
        onToggleCollapse={() => toggleSection('savings')}
        onAddGroup={addSavingsGroup}
        onConvertToGroup={convertSavingsToGroup}
        onConvertToSavings={convertGroupToSavings}
        onMoveToGroup={moveSavingsToGroup}
        getSavingsChildren={getSavingsChildren}
        calculateGroupTotals={calculateGroupTotals}
      />

      <ExpensesSection
        expenses={data.expenses}
        totalIncome={totalIncome}
        mandatoryExpensesPercentage={effectiveMandatoryPercentage}
        onExpenseChange={updateExpenseItem}
        onAddCategory={addExpenseCategory}
        onRemoveCategory={removeExpenseCategory}
        onCategoryNameChange={updateExpenseCategoryName}
        onExpenseIconChange={updateExpenseIcon}
        onReorder={reorderExpenses}
        isCollapsed={collapsedSections.expenses}
        onToggleCollapse={() => toggleSection('expenses')}
      />
    </div>
  )
}
