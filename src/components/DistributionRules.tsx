import React, { useState, useEffect } from 'react'
import './DistributionRules.css'

interface DistributionRulesProps {
  selectedPresetType: '50-30-20' | '50-40-10' | 'custom'
  onPresetChange: (preset: '50-30-20' | '50-40-10' | 'custom') => void
  customPercentages: { mandatory: number; savings: number; remainder: number }
  onCustomPercentagesChange: (percentages: { mandatory: number; savings: number; remainder: number }) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

type PresetType = '50-30-20' | '50-40-10' | 'custom'

export const DistributionRules: React.FC<DistributionRulesProps> = ({
  selectedPresetType,
  onPresetChange,
  customPercentages,
  onCustomPercentagesChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [customMandatory, setCustomMandatory] = useState(customPercentages.mandatory)
  const [customSavings, setCustomSavings] = useState(customPercentages.savings)
  const [customRemainder, setCustomRemainder] = useState(customPercentages.remainder)
  
  useEffect(() => {
    setCustomMandatory(customPercentages.mandatory)
    setCustomSavings(customPercentages.savings)
    setCustomRemainder(customPercentages.remainder)
  }, [customPercentages])
  
  const total = customMandatory + customSavings + customRemainder
  const isValid = total === 100

  const presetRules: Record<'50-30-20' | '50-40-10', { percentage: number; description: string }[]> = {
    '50-30-20': [
      { percentage: 50, description: 'Обязательные расходы' },
      { percentage: 30, description: 'Копилки' },
      { percentage: 20, description: 'Остаток' },
    ],
    '50-40-10': [
      { percentage: 50, description: 'Обязательные расходы' },
      { percentage: 40, description: 'Копилки' },
      { percentage: 10, description: 'Остаток' },
    ],
  }

  const handlePresetChange = (preset: PresetType) => {
    onPresetChange(preset)
  }

  const handleCustomChange = () => {
    if (isValid) {
      onCustomPercentagesChange({
        mandatory: customMandatory,
        savings: customSavings,
        remainder: customRemainder,
      })
    }
  }

  const handleMandatoryChange = (value: number) => {
    setCustomMandatory(Math.max(0, Math.min(100, value)))
  }

  const handleSavingsChange = (value: number) => {
    setCustomSavings(Math.max(0, Math.min(100, value)))
  }

  const handleRemainderChange = (value: number) => {
    setCustomRemainder(Math.max(0, Math.min(100, value)))
  }

  return (
    <div className="distribution-rules">
      <div className="section-header" onClick={onToggleCollapse}>
        <h2 className="section-title">Правила распределения</h2>
        {onToggleCollapse && (
          <button className="collapse-btn" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="preset-buttons">
            <button
              className={selectedPresetType === '50-30-20' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => handlePresetChange('50-30-20')}
            >
              50 / 30 / 20
            </button>
            <button
              className={selectedPresetType === '50-40-10' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => handlePresetChange('50-40-10')}
            >
              50 / 40 / 10
            </button>
            <button
              className={selectedPresetType === 'custom' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => handlePresetChange('custom')}
            >
              Кастомное
            </button>
          </div>

          {selectedPresetType !== 'custom' && presetRules[selectedPresetType] && presetRules[selectedPresetType].length > 0 && (
            <div className="preset-info">
              <p>
                План <strong>{presetRules[selectedPresetType].map(p => p.percentage).join(' / ')}</strong>:
                <br />
                • <strong>{presetRules[selectedPresetType][0].percentage}%</strong> от дохода рекомендуется на обязательные расходы
                <br />
                • <strong>{presetRules[selectedPresetType][1].percentage}%</strong> от дохода рекомендуется для копилок
                <br />
                • <strong>{presetRules[selectedPresetType][2].percentage}%</strong> от дохода рекомендуется оставить как остаток
              </p>
            </div>
          )}

          {selectedPresetType === 'custom' && (
            <div className="custom-rules-section">
              <div className="custom-percentages-form">
                <div className="form-row">
                  <label>Обязательные расходы (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={customMandatory}
                    onChange={(e) => handleMandatoryChange(Number(e.target.value))}
                    onBlur={handleCustomChange}
                    className="percentage-input"
                  />
                  <span className="percentage-symbol">%</span>
                </div>
                <div className="form-row">
                  <label>Копилки (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={customSavings}
                    onChange={(e) => handleSavingsChange(Number(e.target.value))}
                    onBlur={handleCustomChange}
                    className="percentage-input"
                  />
                  <span className="percentage-symbol">%</span>
                </div>
                <div className="form-row">
                  <label>Остаток (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={customRemainder}
                    onChange={(e) => handleRemainderChange(Number(e.target.value))}
                    onBlur={handleCustomChange}
                    className="percentage-input"
                  />
                  <span className="percentage-symbol">%</span>
                </div>
                <div className="form-summary">
                  <div className={`sum-info ${isValid ? 'valid' : 'invalid'}`}>
                    <span className="sum-label">Сумма:</span>
                    <span className="sum-value">{total}%</span>
                    {!isValid && (
                      <span className="error-message">
                        {total < 100 ? `Не хватает ${100 - total}%` : `Превышение на ${total - 100}%`}
                      </span>
                    )}
                    {isValid && (
                      <span className="success-message">✓ Сумма корректна</span>
                    )}
                  </div>
                </div>
              </div>

              {isValid && (
                <div className="custom-preset-info">
                  <p>
                    План <strong>{customMandatory} / {customSavings} / {customRemainder}</strong>:
                    <br />
                    • <strong>{customMandatory}%</strong> от дохода рекомендуется на обязательные расходы
                    <br />
                    • <strong>{customSavings}%</strong> от дохода рекомендуется для копилок
                    <br />
                    • <strong>{customRemainder}%</strong> от дохода рекомендуется оставить как остаток
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

