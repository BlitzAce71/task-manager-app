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
      <div className="task-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <div className="task-counts">
          <span className="count-item">
            Total: <strong>{taskCounts.total}</strong>
          </span>
          <span className="count-item">
            Todo: <strong>{taskCounts.todo}</strong>
          </span>
          <span className="count-item">
            Completed: <strong>{taskCounts.completed}</strong>
          </span>
        </div>

        <div className="task-controls">
          <div className="filter-controls">
            <label htmlFor="filter">Filter:</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="filter-select"
            >
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="sort-controls">
            <label htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="created">Created Date</option>
              <option value="priority">Priority</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="due_date">Due Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="task-list">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="empty-state">
            {tasks.length === 0 ? (
              <>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started!</p>
              </>
            ) : (
              <>
                <h3>No tasks match your filter</h3>
                <p>Try changing your filter or sort options.</p>
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