import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { TaskManager } from './components/tasks/TaskManager'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700">
        <div className="text-center text-white">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <TaskManager />
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
