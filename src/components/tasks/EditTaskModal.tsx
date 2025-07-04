import { useState, useEffect } from 'react'
import type { Task, TaskStatus, TaskPriority } from '../../types/database'
import type { UpdateTaskData } from '../../hooks/useTasks'

interface EditTaskModalProps {
  task: Task | null
  categories: Array<{ id: string; name: string; color: string }>
  onSave: (id: string, data: UpdateTaskData) => Promise<void>
  onClose: () => void
  loading?: boolean
}

export function EditTaskModal({ task, categories, onSave, onClose, loading = false }: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setCategoryId(task.category_id || '')
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '')
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!task || !title.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        priority,
        status,
        due_date: dueDate || undefined,
      })

      onClose()
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!task) return null

  const isDisabled = loading || isSubmitting
  const isSubmitDisabled = isDisabled || !title.trim()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-8 pb-0">
          <h3 className="text-2xl font-semibold text-gray-900">Edit Task</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                disabled={isDisabled}
                maxLength={255}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details... (optional)"
                disabled={isDisabled}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300 resize-vertical min-h-[80px]"
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={isDisabled}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300 bg-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-priority" className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isDisabled}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-category" className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                id="edit-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isDisabled}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300 bg-white"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>
              <input
                id="edit-dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isDisabled}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-300 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}