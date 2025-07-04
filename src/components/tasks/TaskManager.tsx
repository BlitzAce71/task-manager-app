import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { EditTaskModal } from './EditTaskModal'
import { UserProfile } from '../UserProfile'
import { DatabaseDebug } from '../DatabaseDebug'
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
  } = useTasks()

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Debug logging (removed for cleaner console)

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
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-white/30 hover:border-white/50 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/25"
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <span className="font-medium">⚠️ {error}</span>
          <div className="text-sm mt-2">
            If you see "relation does not exist" errors, the database tables need to be created. 
            Please run the migration in your Supabase dashboard.
          </div>
        </div>
      )}

      <div className="space-y-8">
        {showAddForm && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
            <AddTaskForm
              categories={categories}
              onSubmit={handleCreateTask}
              loading={loading}
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
          loading={loading}
        />
      )}
      
      <DatabaseDebug />
    </div>
  )
}