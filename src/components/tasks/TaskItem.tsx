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

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-600 text-white'
      case 'medium': return 'bg-amber-600 text-white'
      case 'low': return 'bg-green-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <div className={`flex items-start gap-4 p-6 bg-white border-2 rounded-xl transition-all duration-300 hover:border-gray-300 hover:shadow-md ${
      task.status === 'completed' ? 'opacity-70' : ''
    } ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="mt-1">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={handleToggleStatus}
          disabled={isToggling}
          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
          <h4 className={`text-lg font-semibold text-gray-900 leading-tight ${
            task.status === 'completed' ? 'line-through' : ''
          }`}>
            {task.title}
          </h4>
          <div className="flex gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${getPriorityClasses(task.priority)}`}>
              {task.priority}
            </span>
            {task.category && (
              <span 
                className="px-2 py-1 rounded-md text-xs font-semibold text-white"
                style={{ backgroundColor: task.category.color }}
              >
                {task.category.name}
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-gray-600 mb-3 leading-relaxed">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>
            Created {formatDate(task.created_at)}
          </span>
          {task.due_date && (
            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
              Due {formatDateTime(task.due_date)}
            </span>
          )}
          {task.completed_at && (
            <span className="text-green-600">
              Completed {formatDate(task.completed_at)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0 mt-1">
        <button
          onClick={() => onEdit(task)}
          disabled={isDeleting}
          title="Edit task"
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete task"
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>
    </div>
  )
}