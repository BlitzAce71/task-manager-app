import { useState, useEffect } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { EditTaskModal } from './EditTaskModal'
import { UserProfile } from '../UserProfile'
import { DatabaseDebug } from '../DatabaseDebug'
import { recovery } from '../../utils/recovery'
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

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loadingStartTime] = useState(Date.now())

  // Debug logging
  console.log('TaskManager render - loading:', loading, 'error:', error, 'tasks:', tasks.length, 'syncing:', syncing)
  console.log('TaskManager render - categories:', categories.length)

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

  const handleCreateTask = async (taskData: Parameters<typeof createTask>[0]) => {
    await createTask(taskData)
    setShowAddForm(false)
  }

  const handleUpdateTask = async (id: string, updates: Parameters<typeof updateTask>[1]) => {
    await updateTask(id, updates)
    setEditingTask(null)
  }

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
            onClick={() => setShowAddForm(!showAddForm)}
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
                {error.includes('timeout') ? (
                  <div>
                    <p>The app seems unresponsive. Try:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Clicking the refresh button above</li>
                      <li>Refreshing your browser</li>
                      <li>Checking your internet connection</li>
                    </ul>
                  </div>
                ) : error.includes('relation does not exist') ? (
                  <p>Database tables need to be created. Please run the migration in your Supabase dashboard.</p>
                ) : (
                  <p>An error occurred while loading your tasks. Please try refreshing.</p>
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
          <TaskList
            tasks={tasks}
            categories={categories}
            onToggleStatus={toggleTaskStatus}
            onEdit={setEditingTask}
            onDelete={deleteTask}
            loading={loading}
          />
        </div>
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          categories={categories}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      
      <DatabaseDebug />
    </div>
  )
}