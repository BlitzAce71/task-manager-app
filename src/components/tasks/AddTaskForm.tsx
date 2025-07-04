import { useState } from 'react'
import type { TaskPriority } from '../../types/database'
import type { CreateTaskData } from '../../hooks/useTasks'

interface AddTaskFormProps {
  categories: Array<{ id: string; name: string; color: string }>
  onSubmit: (data: CreateTaskData) => Promise<void>
  loading?: boolean
}

export function AddTaskForm({ categories, onSubmit, loading = false }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        priority,
        due_date: dueDate || undefined,
      })

      // Reset form
      setTitle('')
      setDescription('')
      setCategoryId('')
      setPriority('medium')
      setDueDate('')
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = loading || isSubmitting || !title.trim()

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <div className="form-header">
        <h3>Add New Task</h3>
      </div>

      <div className="form-grid">
        <div className="form-group span-2">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            disabled={isDisabled}
            maxLength={255}
          />
        </div>

        <div className="form-group span-2">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details... (optional)"
            disabled={isDisabled}
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isDisabled}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={isDisabled}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="form-group span-2">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="submit-button"
          disabled={isDisabled}
        >
          {isSubmitting ? 'Adding Task...' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}