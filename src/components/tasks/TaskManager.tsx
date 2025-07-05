import { useState, useEffect, useCallback } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { EditTaskModal } from './EditTaskModal'
import { UserProfile } from '../UserProfile'
import { DatabaseDebug } from '../DatabaseDebug'
import { AuthDebug } from '../AuthDebug'
import { RefreshDebugger } from '../RefreshDebugger'
import { DataLoadingFallback, OfflineFallback } from '../FallbackUI'
import { recovery } from '../../utils/recovery'
import { trackUserAction, clearOldActions } from '../../utils/networkUtils'
import type { Task } from '../../types/database'

export function TaskManager() {
  const {
    tasks,
    categories,
    loading,
    error,
    syncing,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refreshData,
  } = useTasks()

  const { offline, justCameOnline, resetJustCameOnline } = useNetworkStatus()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loadingStartTime] = useState(Date.now())

  // Debug logging - More detailed for refresh issue
  console.log('TaskManager render:', {
    loading,
    error,
    tasksCount: tasks.length,
    categoriesCount: categories.length,
    syncing,
    loadingTime: Date.now() - loadingStartTime
  })
  
  // Check if we're hitting the timeout
  if (loading && (Date.now() - loadingStartTime) > 10000) {
    console.error('TaskManager: Loading has been stuck for', (Date.now() - loadingStartTime) / 1000, 'seconds')
  }

  // Detect if loading has been stuck for too long
  const isStuckLoading = loading && (Date.now() - loadingStartTime) > 20000 // 20 seconds

  // Update activity tracking
  useEffect(() => {
    recovery.updateActivity()
  }, [tasks, categories])

  // Clear recovery mode if we successfully loaded
  useEffect(() => {
    if (!loading && tasks.length > 0 && recovery.isInRecoveryMode()) {
      recovery.clearRecoveryMode()
    }
  }, [loading, tasks.length])

  // Handle network status changes
  useEffect(() => {
    if (justCameOnline) {
      trackUserAction('network_reconnected')
      refreshData()
      resetJustCameOnline()
    }
  }, [justCameOnline, refreshData, resetJustCameOnline])

  // Clear old actions periodically
  useEffect(() => {
    const interval = setInterval(clearOldActions, 30 * 60 * 1000) // Every 30 minutes
    return () => clearInterval(interval)
  }, [])

  const handleCreateTask = useCallback(async (taskData: Parameters<typeof createTask>[0]) => {
    await createTask(taskData)
    setShowAddForm(false)
  }, [createTask])

  const handleUpdateTask = useCallback(async (id: string, updates: Parameters<typeof updateTask>[1]) => {
    await updateTask(id, updates)
    setEditingTask(null)
  }, [updateTask])

  const handleToggleAddForm = useCallback(() => {
    setShowAddForm(prev => !prev)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setEditingTask(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <UserProfile />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">Task Manager</h1>
            {syncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Syncing...</span>
              </div>
            )}
            {offline && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-white text-sm font-medium">Offline</span>
              </div>
            )}
          </div>
          <p className="text-blue-100 text-lg">Stay organized and get things done</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 px-4 py-3 rounded-xl font-semibold hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/25"
            title="Refresh data"
          >
            🔄
          </button>
          <button
            onClick={handleToggleAddForm}
            className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-white/30 hover:border-white/50 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/25"
          >
            {showAddForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>
      </div>

      {isStuckLoading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="font-medium">⏱️ Taking longer than expected...</span>
              <div className="text-sm mt-2">
                <p>The app seems to be taking a while to load. This might be due to:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Slow internet connection</li>
                  <li>Server response delay</li>
                  <li>Browser refresh issues</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => recovery.clearLocalStorageAndRefresh()}
                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
                title="Clear cache and refresh"
              >
                Reset App
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="font-medium">⚠️ {error}</span>
              <div className="text-sm mt-2">
                {error.includes('timeout') || error.includes('longer than expected') ? (
                  <div>
                    <p>The app is taking longer than usual to respond. Try:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Clicking the retry button</li>
                      <li>Checking your internet connection</li>
                      <li>Refreshing your browser if the issue persists</li>
                    </ul>
                  </div>
                ) : error.includes('Database tables not found') ? (
                  <p>Your database needs to be set up. Please check your Supabase configuration.</p>
                ) : error.includes('sign in') || error.includes('Authentication') ? (
                  <p>Please sign out and sign back in to continue.</p>
                ) : error.includes('connection') || error.includes('network') ? (
                  <div>
                    <p>Having trouble connecting. Please:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check your internet connection</li>
                      <li>Try again in a few moments</li>
                    </ul>
                  </div>
                ) : (
                  <p>Something went wrong. Please try refreshing or contact support if the issue continues.</p>
                )}
              </div>
            </div>
            <button
              onClick={refreshData}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {showAddForm && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
            <AddTaskForm
              categories={categories}
              onSubmit={handleCreateTask}
            />
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
          {offline ? (
            <OfflineFallback onRetry={refreshData} />
          ) : error && !loading ? (
            <DataLoadingFallback onRetry={refreshData} />
          ) : (
            <TaskList
              tasks={tasks}
              categories={categories}
              onToggleStatus={toggleTaskStatus}
              onEdit={setEditingTask}
              onDelete={deleteTask}
              loading={loading}
            />
          )}
        </div>
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          categories={categories}
          onSave={handleUpdateTask}
          onClose={handleCloseEditModal}
        />
      )}
      
      <DatabaseDebug />
      <AuthDebug />
      <RefreshDebugger />
    </div>
  )
}