import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Task, TaskStatus, TaskPriority, Category } from '../types/database'

export interface CreateTaskData {
  title: string
  description?: string
  category_id?: string
  priority: TaskPriority
  due_date?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  category_id?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
}

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks
  const fetchTasks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      setTasks(data || [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      throw new Error(message)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Categories error:', error)
        throw error
      }
      
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch categories')
    }
  }

  // Create task
  const createTask = async (taskData: CreateTaskData) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error
      
      setTasks(prev => [data, ...prev])
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
      throw new Error(message)
    }
  }

  // Update task
  const updateTask = async (id: string, updates: UpdateTaskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      setTasks(prev => prev.map(task => task.id === id ? data : task))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      setError(message)
      throw new Error(message)
    }
  }

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      setError(message)
      throw new Error(message)
    }
  }

  // Toggle task status
  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTask(id, { status: newStatus })
  }

  // Initial data fetch
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
          await Promise.all([
            fetchTasks(),
            fetchCategories()
          ])
        } catch (error) {
          console.error('Failed to load initial data:', error)
          setError(error instanceof Error ? error.message : 'Failed to load data')
        } finally {
          setLoading(false)
        }
      }
      loadData()
    } else {
      setLoading(false)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    tasks,
    categories,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch: fetchTasks,
  }
}