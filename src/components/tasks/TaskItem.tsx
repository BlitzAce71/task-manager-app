import { useState } from 'react'
import type { Task } from '../../types/database'

interface TaskItemProps {
  task: Task
  onToggleStatus: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export function TaskItem({ task, onToggleStatus, onEdit, onDelete, loading = false }: TaskItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await onToggleStatus(task.id)
    } catch (error) {
      console.error('Failed to toggle task status:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#65a30d'
      default: return '#6b7280'
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <div className={`task-item ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={handleToggleStatus}
          disabled={loading || isToggling}
          className="checkbox"
        />
      </div>

      <div className="task-content">
        <div className="task-header">
          <h4 className="task-title">{task.title}</h4>
          <div className="task-meta">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
              {task.priority}
            </span>
            {task.category && (
              <span 
                className="category-badge"
                style={{ backgroundColor: task.category.color }}
              >
                {task.category.name}
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-dates">
          <span className="created-date">
            Created {formatDate(task.created_at)}
          </span>
          {task.due_date && (
            <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              Due {formatDateTime(task.due_date)}
            </span>
          )}
          {task.completed_at && (
            <span className="completed-date">
              Completed {formatDate(task.completed_at)}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          onClick={() => onEdit(task)}
          className="edit-button"
          disabled={loading || isDeleting}
          title="Edit task"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="delete-button"
          disabled={loading || isDeleting}
          title="Delete task"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>
    </div>
  )
}