import { useState, useMemo, useRef, useEffect } from 'react'
import { TaskItem } from './TaskItem'
import type { Task, TaskPriority } from '../../types/database'

interface TaskListProps {
  tasks: Task[]
  categories: Array<{ id: string; name: string; color: string }>
  onToggleStatus: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

type FilterStatus = 'all' | 'todo' | 'in_progress' | 'completed' | 'cancelled'
type FilterPriority = 'all' | TaskPriority
type SortOption = 'created' | 'priority' | 'alphabetical' | 'due_date'

export function TaskList({ tasks, categories, onToggleStatus, onEdit, onDelete, loading = false }: TaskListProps) {
  // State for all filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('created')
  
  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Keyboard shortcut: Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Search filter (title and description)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category_id === categoryFilter)
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
  }, [tasks, debouncedSearchQuery, statusFilter, priorityFilter, categoryFilter, sort])

  const taskCounts = useMemo(() => {
    const total = tasks.length
    const visible = filteredAndSortedTasks.length
    const completed = tasks.filter(task => task.status === 'completed').length
    const todo = tasks.filter(task => task.status === 'todo').length
    const inProgress = tasks.filter(task => task.status === 'in_progress').length
    const cancelled = tasks.filter(task => task.status === 'cancelled').length
    return { total, visible, completed, todo, inProgress, cancelled }
  }, [tasks, filteredAndSortedTasks])
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setSort('created')
  }
  
  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">Loading tasks...</p>
      </div>
    )
  }

  if (!loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-lg">No tasks yet. Create your first task!</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Search and Filters Section */}
      <div className="mb-8">
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks by title or description... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="">No Category</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created">Created Date</option>
              <option value="priority">Priority</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="due_date">Due Date</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Task Count Display */}
        <div className="flex flex-wrap gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-800">{taskCounts.visible}</span> of{' '}
            <span className="font-semibold text-gray-800">{taskCounts.total}</span> tasks
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600">
              Todo: <span className="font-semibold text-blue-600">{taskCounts.todo}</span>
            </span>
            <span className="text-gray-600">
              In Progress: <span className="font-semibold text-yellow-600">{taskCounts.inProgress}</span>
            </span>
            <span className="text-gray-600">
              Completed: <span className="font-semibold text-green-600">{taskCounts.completed}</span>
            </span>
            <span className="text-gray-600">
              Cancelled: <span className="font-semibold text-red-600">{taskCounts.cancelled}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
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
                <h3 className="text-xl font-medium text-gray-800 mb-2">No tasks match your filters</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
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
            />
          ))
        )}
      </div>
    </div>
  )
}