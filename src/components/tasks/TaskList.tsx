import { useState, useMemo } from 'react'
import { TaskItem } from './TaskItem'
import type { Task } from '../../types/database'

interface TaskListProps {
  tasks: Task[]
  onToggleStatus: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

type FilterStatus = 'all' | 'todo' | 'completed'
type SortOption = 'created' | 'priority' | 'alphabetical' | 'due_date'

export function TaskList({ tasks, onToggleStatus, onEdit, onDelete, loading = false }: TaskListProps) {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sort, setSort] = useState<SortOption>('created')

  const filteredAndSortedTasks = useMemo(() => {
    // Filter tasks
    let filtered = tasks
    if (filter === 'todo') {
      filtered = tasks.filter(task => task.status !== 'completed')
    } else if (filter === 'completed') {
      filtered = tasks.filter(task => task.status === 'completed')
    }

    // Sort tasks
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        
        case 'priority': {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        
        case 'due_date': {
          // Tasks with due dates first, then by due date
          if (a.due_date && !b.due_date) return -1
          if (!a.due_date && b.due_date) return 1
          if (!a.due_date && !b.due_date) return 0
          return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
        }
        
        default:
          return 0
      }
    })

    return sorted
  }, [tasks, filter, sort])

  const taskCounts = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(task => task.status === 'completed').length
    const todo = total - completed
    return { total, completed, todo }
  }, [tasks])

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap gap-4">
          <span className="text-gray-600">
            Total: <span className="font-semibold text-gray-800">{taskCounts.total}</span>
          </span>
          <span className="text-gray-600">
            Todo: <span className="font-semibold text-blue-600">{taskCounts.todo}</span>
          </span>
          <span className="text-gray-600">
            Completed: <span className="font-semibold text-green-600">{taskCounts.completed}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700">
              Filter:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created">Created Date</option>
              <option value="priority">Priority</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="due_date">Due Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            {tasks.length === 0 ? (
              <>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No tasks yet</h3>
                <p className="text-gray-600">Create your first task to get started!</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No tasks match your filter</h3>
                <p className="text-gray-600">Try changing your filter or sort options.</p>
              </>
            )}
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  )
}