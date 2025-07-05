import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'

// Lazy load components for code splitting
const AuthPage = lazy(() => import('./components/auth/AuthPage').then(module => ({
  default: module.AuthPage
})))
const TaskManager = lazy(() => import('./components/tasks/TaskManager').then(module => ({
  default: module.TaskManager
})))
const NotFoundPage = lazy(() => import('./components/NotFoundPage').then(module => ({
  default: module.NotFoundPage
})))

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner text="Authenticating..." />
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner text="Loading authentication..." />}>
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner text="Loading application..." />}>
      <Routes>
        <Route path="/" element={<TaskManager />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
