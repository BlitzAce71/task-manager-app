import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export function AuthDebug() {
  const { user, session, loading: authLoading } = useAuth()
  const { tasks, categories, loading: tasksLoading, error } = useTasks()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      auth: {
        loading: authLoading,
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
        userEmail: user?.email,
      },
      tasks: {
        loading: tasksLoading,
        taskCount: tasks.length,
        categoryCount: categories.length,
        error: error,
      },
      session: {
        accessToken: session?.access_token ? 'present' : 'missing',
        refreshToken: session?.refresh_token ? 'present' : 'missing',
        expiresAt: session?.expires_at,
        expiresIn: session?.expires_in,
      },
      localStorage: {
        keys: Object.keys(localStorage).filter(key => key.includes('supabase')),
      },
    }

    // Test database connectivity
    if (user) {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        info.userProfile = {
          exists: !profileError,
          error: profileError?.message,
          data: userProfile,
        }

        const { error: taskError } = await supabase
          .from('tasks')
          .select('count')
          .eq('user_id', user.id)
          .limit(1)

        info.taskConnectivity = {
          success: !taskError,
          error: taskError?.message,
        }
      } catch (err) {
        info.connectivityError = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    setDebugInfo(info)
  }

  if (!import.meta.env.DEV) {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-auto z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Auth Debug</span>
        <button
          onClick={runDiagnostics}
          className="bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-700"
        >
          Run Test
        </button>
      </div>
      
      <div className="space-y-2">
        <div>Auth Loading: {authLoading ? 'true' : 'false'}</div>
        <div>Tasks Loading: {tasksLoading ? 'true' : 'false'}</div>
        <div>User: {user ? user.id.slice(0, 8) + '...' : 'null'}</div>
        <div>Tasks: {tasks.length}</div>
        <div>Categories: {categories.length}</div>
        {error && <div className="text-red-300">Error: {error}</div>}
      </div>

      {debugInfo && (
        <details className="mt-4">
          <summary className="cursor-pointer">Full Debug Info</summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}