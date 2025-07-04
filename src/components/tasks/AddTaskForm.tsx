import { useState } from 'react'
import type { TaskPriority } from '../../types/database'
import type { CreateTaskData } from '../../hooks/useTasks'

interface AddTaskFormProps {
  categories: Array<{ id: string; name: string; color: string }>
  onSubmit: (data: CreateTaskData) => Promise<void>
}

export function AddTaskForm({ categories, onSubmit }: AddTaskFormProps) {
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

  const isDisabled = isSubmitting // Removed global loading to prevent form from being stuck disabled
  const isSubmitDisabled = isDisabled || !title.trim()

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Add New Task</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
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
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
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
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
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

        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
            Priority
          </label>
          <select
            id="priority"
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
          <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Due Date
          </label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isDisabled}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isSubmitting ? 'Adding Task...' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}