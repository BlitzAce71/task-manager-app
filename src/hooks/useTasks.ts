import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Task, TaskStatus, TaskPriority, Category } from '../types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

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
  const [syncing, setSyncing] = useState(false)
  
  // Keep track of subscription to prevent duplicates
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  // Fetch tasks
  const fetchTasks = async () => {
    if (!user) {
      console.log('No user found, skipping task fetch')
      return
    }

    console.log('Fetching tasks for user:', user.id)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      console.log('Tasks fetched successfully:', data?.length || 0)
      setTasks(data || [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      throw new Error(message)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    if (!user) {
      console.log('No user found, skipping categories fetch')
      return
    }

    console.log('Fetching categories for user:', user.id)
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
      
      console.log('Categories fetched successfully:', data?.length || 0)
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch categories')
    }
  }

  // Real-time event handlers
  const handleRealtimeInsert = async (payload: any) => {
    if (payload.new?.user_id !== user?.id) return
    
    setSyncing(true)
    try {
      // Fetch the complete task with category relationship
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', payload.new.id)
        .single()

      if (!error && data) {
        setTasks(prev => {
          // Check if task already exists to prevent duplicates
          const exists = prev.some(task => task.id === data.id)
          if (exists) return prev
          
          // Add new task at the beginning (most recent first)
          return [data, ...prev]
        })
      }
    } catch (err) {
      console.error('Error handling real-time insert:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleRealtimeUpdate = async (payload: any) => {
    if (payload.new?.user_id !== user?.id) return
    
    setSyncing(true)
    try {
      // Fetch the complete updated task with category relationship
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', payload.new.id)
        .single()

      if (!error && data) {
        setTasks(prev => prev.map(task => 
          task.id === data.id ? data : task
        ))
      }
    } catch (err) {
      console.error('Error handling real-time update:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleRealtimeDelete = (payload: any) => {
    if (payload.old?.user_id !== user?.id) return
    
    setSyncing(true)
    setTasks(prev => prev.filter(task => task.id !== payload.old.id))
    setTimeout(() => setSyncing(false), 500) // Brief visual indicator
  }

  // Create task (no longer optimistically updates since real-time handles it)
  const createTask = async (taskData: CreateTaskData) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
      throw new Error(message)
    }
  }

  // Update task (no longer optimistically updates since real-time handles it)
  const updateTask = async (id: string, updates: UpdateTaskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      setError(message)
      throw new Error(message)
    }
  }

  // Delete task (no longer optimistically updates since real-time handles it)
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
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

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const setupRealtimeSubscription = () => {
      // Clean up existing subscription
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      // Create new subscription
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          handleRealtimeInsert
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          handleRealtimeUpdate
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          handleRealtimeDelete
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription established')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Real-time subscription error')
          }
        })

      subscriptionRef.current = channel
    }

    // Initial data fetch
    const loadData = async () => {
      console.log('Starting data load...')
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching tasks and categories...')
        await Promise.all([
          fetchTasks(),
          fetchCategories()
        ])
        
        console.log('Data fetch completed, setting up real-time subscription...')
        // Set up real-time subscription after initial data load
        setupRealtimeSubscription()
        console.log('Real-time subscription setup completed')
      } catch (error) {
        console.error('Failed to load initial data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    loadData()

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
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
    syncing,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch: fetchTasks,
  }
}