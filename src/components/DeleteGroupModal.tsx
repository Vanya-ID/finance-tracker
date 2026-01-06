import React from 'react'
import './DeleteGroupModal.css'

interface DeleteGroupModalProps {
  groupName: string
  childrenCount: number
  onDeleteWithChildren: () => void
  onDeleteGroupOnly: () => void
  onCancel: () => void
}

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  groupName,
  childrenCount,
  onDeleteWithChildren,
  onDeleteGroupOnly,
  onCancel,
}) => {
  return (
    <div className="delete-group-modal-overlay" onClick={onCancel}>
      <div className="delete-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-group-modal-header">
          <h2>Удаление группы "{groupName}"</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="delete-group-modal-content">
          <p>В этой группе {childrenCount} {childrenCount === 1 ? 'копилка' : childrenCount < 5 ? 'копилки' : 'копилок'}.</p>
          <p>Выберите действие:</p>
        </div>

        <div className="delete-group-modal-actions">
          <button
            className="delete-btn danger"
            onClick={onDeleteWithChildren}
          >
            Удалить группу и все копилки ({childrenCount})
          </button>
          <button
            className="delete-btn warning"
            onClick={onDeleteGroupOnly}
          >
            Удалить только группу (копилки останутся)
          </button>
          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

