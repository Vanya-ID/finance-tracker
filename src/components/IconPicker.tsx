import React from 'react'
import { availableIcons } from '../utils/iconUtils'
import './IconPicker.css'

interface IconPickerProps {
  currentIcon?: string
  onSelect: (icon: string) => void
  onClose: () => void
}

export const IconPicker: React.FC<IconPickerProps> = ({ currentIcon, onSelect, onClose }) => {
  const handleIconClick = (icon: string) => {
    onSelect(icon)
    onClose()
  }

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header">
          <h3>Выберите иконку</h3>
          <button className="icon-picker-close" onClick={onClose}>×</button>
        </div>
        <div className="icon-picker-grid">
          {availableIcons.map((icon, index) => (
            <button
              key={index}
              className={`icon-picker-item ${currentIcon === icon ? 'selected' : ''}`}
              onClick={() => handleIconClick(icon)}
              title={icon}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

