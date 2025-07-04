import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { EditTaskModal } from './EditTaskModal'
import { UserProfile } from '../UserProfile'
import { DatabaseDebug } from '../DatabaseDebug'
import type { Task } from '../../types/database'
import './TaskManager.css'

export function TaskManager() {
  const {
    tasks,
    categories,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  } = useTasks()

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Debug logging
  console.log('🎯 TaskManager render:', {
    loading,
    tasksCount: tasks.length,
    categoriesCount: categories.length,
    error,
    showAddForm
  })

  const handleCreateTask = async (taskData: Parameters<typeof createTask>[0]) => {
    await createTask(taskData)
    setShowAddForm(false)
  }

  const handleUpdateTask = async (id: string, updates: Parameters<typeof updateTask>[1]) => {
    await updateTask(id, updates)
    setEditingTask(null)
  }

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <UserProfile />
        <div className="header-content">
          <h1>Task Manager</h1>
          <p>Stay organized and get things done</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-task-toggle"
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            If you see "relation does not exist" errors, the database tables need to be created. 
            Please run the migration in your Supabase dashboard.
          </div>
        </div>
      )}

      <div className="task-manager-content">
        {showAddForm && (
          <div className="add-task-section">
            <AddTaskForm
              categories={categories}
              onSubmit={handleCreateTask}
              loading={loading}
            />
          </div>
        )}

        <div className="task-list-section">
          <TaskList
            tasks={tasks}
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