import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../utils/logger'
import { getErrorMessage, trackUserAction } from '../utils/networkUtils'
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
      logger.info('No user found, skipping task fetch')
      return
    }

    logger.info('Fetching tasks for user', { userId: user.id, email: user.email })
    
    // Test if we can access Supabase at all
    console.log('Testing Supabase session...')
    const session = await supabase.auth.getSession()
    console.log('Current session:', {
      hasSession: !!session.data.session,
      hasAccessToken: !!session.data.session?.access_token,
      expiresAt: session.data.session?.expires_at,
      error: session.error?.message
    })
    
    try {
      // First test basic connectivity
      console.log('Testing basic database connectivity...')
      const { error: testError } = await supabase
        .from('tasks')
        .select('count')
        .eq('user_id', user.id)
        .limit(1)

      if (testError) {
        logger.error('Basic connectivity test failed', testError)
        if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
          throw new Error('Database tables not found. Please check your Supabase setup.')
        }
        if (testError.message.includes('JWT') || testError.message.includes('token')) {
          throw new Error('Authentication error. Please try signing out and back in.')
        }
        throw testError
      }

      logger.debug('Basic connectivity test passed')

      // Now fetch full data
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Database error during task fetch', error)
        throw error
      }
      
      logger.info('Tasks fetched successfully', { count: data?.length || 0 })
      setTasks(data || [])
    } catch (err) {
      logger.error('Failed to fetch tasks', err)
      const message = err instanceof Error ? getErrorMessage(err as any) : 'Unable to load your tasks'
      throw new Error(message)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    if (!user) {
      logger.info('No user found, skipping categories fetch')
      return
    }

    logger.info('Fetching categories for user', { userId: user.id })
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        logger.error('Categories error', error)
        throw error
      }
      
      logger.info('Categories fetched successfully', { count: data?.length || 0 })
      setCategories(data || [])
    } catch (err) {
      logger.error('Failed to fetch categories', err)
      throw new Error(err instanceof Error ? getErrorMessage(err as any) : 'Unable to load categories')
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
    console.log('Real-time UPDATE event received:', payload)
    if (payload.new?.user_id !== user?.id) {
      console.log('UPDATE event ignored - different user')
      return
    }
    
    console.log('Processing real-time UPDATE for task:', payload.new.id)
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
        console.log('Real-time UPDATE: Updating task in state:', data)
        setTasks(prev => {
          const updated = prev.map(task => 
            task.id === data.id ? data : task
          )
          console.log('Real-time UPDATE: Tasks state updated')
          return updated
        })
      } else {
        console.error('Real-time UPDATE: Failed to fetch updated task:', error)
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

  // Create task with retry mechanism and user-friendly error handling
  const createTask = async (taskData: CreateTaskData) => {
    if (!user) throw new Error('Please sign in to create tasks')

    console.log('🔄 useTasks: Creating task with data:', taskData)
    trackUserAction('create_task', { title: taskData.title, priority: taskData.priority })
    
    const createTaskOperation = async () => {
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

      if (error) {
        console.error('❌ useTasks: Create task error:', error)
        throw error
      }
      
      return data
    }

    try {
      // Simple retry mechanism with timeout
      let lastError: Error
      const maxRetries = 3
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const data = await Promise.race([
            createTaskOperation(),
            new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('Creating task is taking longer than expected. Please try again.'))
              }, 10000) // 10 second timeout
            })
          ]) as any
          
          // Success - set up optimistic update and return
          console.log('✅ useTasks: Task created successfully:', data)
          
          // Optimistic update as fallback if real-time doesn't trigger
          if (data) {
            setTimeout(() => {
              setTasks(prev => {
                const exists = prev.some(task => task.id === data.id)
                if (!exists) {
                  console.log('➕ useTasks: Adding task via optimistic update (real-time fallback)')
                  return [data, ...prev]
                }
                console.log('✓ useTasks: Task already exists (real-time worked)')
                return prev
              })
            }, 300) // Reduced to 300ms for faster fallback
          }
          
          return data
        } catch (error) {
          lastError = error as Error
          
          if (attempt === maxRetries) {
            throw lastError
          }
          
          // Wait before retry with exponential backoff
          const delay = 1000 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      throw lastError!
    } catch (err) {
      console.error('❌ useTasks: Create task failed:', err)
      const message = err instanceof Error ? getErrorMessage(err as any) : 'Unable to create task'
      setError(message)
      throw new Error(message)
    }
  }

  // Update task with optimistic updates as fallback for real-time
  const updateTask = async (id: string, updates: UpdateTaskData, skipOptimistic = false) => {
    console.log('Updating task:', id, 'with:', updates)
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

      if (error) {
        console.error('Update task error:', error)
        throw error
      }
      console.log('Task updated successfully:', data)
      
      // Optimistic update as fallback if real-time doesn't trigger (unless skipped)
      if (data && !skipOptimistic) {
        setTimeout(() => {
          setTasks(prev => {
            const updated = prev.map(task => {
              if (task.id === data.id) {
                // Check if the specific field we updated actually changed
                const statusMatches = task.status === data.status
                const titleMatches = task.title === data.title
                const descMatches = task.description === data.description
                
                if (statusMatches && titleMatches && descMatches) {
                  console.log('Task already updated by real-time - UI is current')
                  return task
                } else {
                  console.log('Updating task via optimistic update (real-time fallback)', {
                    oldStatus: task.status,
                    newStatus: data.status,
                    oldTitle: task.title,
                    newTitle: data.title
                  })
                  return data
                }
              }
              return task
            })
            return updated
          })
        }, 300) // Reduced to 300ms for faster fallback
      }
      
      return data
    } catch (err) {
      console.error('Update task failed:', err)
      const message = err instanceof Error ? err.message : 'Failed to update task'
      setError(message)
      throw new Error(message)
    }
  }

  // Delete task with optimistic updates as fallback for real-time
  const deleteTask = async (id: string) => {
    console.log('Deleting task:', id)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete task error:', error)
        throw error
      }
      console.log('Task deleted successfully')
      
      // Optimistic update as fallback if real-time doesn't trigger
      setTimeout(() => {
        setTasks(prev => {
          const exists = prev.some(task => task.id === id)
          if (exists) {
            console.log('Removing task via optimistic update (real-time fallback)')
            return prev.filter(task => task.id !== id)
          }
          return prev
        })
      }, 1000) // Wait 1 second to see if real-time handles it
      
    } catch (err) {
      console.error('Delete task failed:', err)
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      setError(message)
      throw new Error(message)
    }
  }

  // Toggle task status with immediate UI update
  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed'
    
    // Immediate optimistic update for better UX
    console.log('Toggling task status immediately:', id, 'from', task.status, 'to', newStatus)
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ))
    
    // Then update database (skip optimistic updates since we already did it)
    try {
      await updateTask(id, { status: newStatus }, true)
    } catch (error) {
      // Revert on error
      console.error('Failed to update task status, reverting:', error)
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, status: task.status } : t
      ))
      setError('Failed to update task status')
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    logger.debug('useTasks effect triggered', { userId: user?.id || 'null' })
    if (!user) {
      logger.info('No user found, clearing data and setting loading to false')
      setLoading(false)
      setTasks([])
      setCategories([])
      setError(null)
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
          console.log('Real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription established successfully')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Real-time subscription error - falling back to optimistic updates')
          } else if (status === 'CLOSED') {
            console.warn('Real-time subscription closed')
          }
        })

      subscriptionRef.current = channel
    }

    // Initial data fetch with timeout protection
    const loadData = async () => {
      logger.info('Starting data load for user', { userId: user.id })
      setLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        logger.warn('Data load timeout - setting loading to false')
        setLoading(false)
        setError('Taking longer than expected to load. Please check your connection and try again.')
      }, 15000) // 15 second timeout
      
      try {
        logger.debug('Fetching tasks and categories...')
        await Promise.all([
          fetchTasks(),
          fetchCategories()
        ])
        
        clearTimeout(timeoutId)
        logger.info('Data fetch completed, setting up real-time subscription...')
        // Set up real-time subscription after initial data load
        setupRealtimeSubscription()
        logger.debug('Real-time subscription setup completed')
      } catch (error) {
        clearTimeout(timeoutId)
        logger.error('Failed to load initial data', error)
        setError(error instanceof Error ? error.message : 'Unable to load your data')
      } finally {
        clearTimeout(timeoutId)
        logger.debug('Setting loading to false')
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

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!user) return
    console.log('Manual data refresh triggered')
    setLoading(true)
    try {
      await Promise.all([fetchTasks(), fetchCategories()])
    } catch (error) {
      console.error('Manual refresh failed:', error)
      setError(error instanceof Error ? getErrorMessage(error as any) : 'Unable to refresh your data')
    } finally {
      setLoading(false)
    }
  }, [user, fetchTasks, fetchCategories])

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
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
    refreshData,
  }), [
    tasks,
    categories,
    loading,
    error,
    syncing,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    fetchTasks,
    refreshData,
  ])
}