import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { UserProfile } from './components/UserProfile'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DebugInfo } from './components/DebugInfo'
import './App.css'

function TaskManagerApp() {
  const [currentDateTime, setCurrentDateTime] = useState<string>('')
  const [currentQuote, setCurrentQuote] = useState<string>('')

  const motivationalQuotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "The only impossible journey is the one you never begin. - Tony Robbins",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done."
  ]

  const showDateTime = () => {
    const now = new Date()
    const formattedDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setCurrentDateTime(formattedDateTime)
  }

  const showRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
    setCurrentQuote(motivationalQuotes[randomIndex])
  }

  return (
    <div className="app">
      <UserProfile />
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to Taylor's Task Manager</h1>
        <p className="welcome-subtitle">
          Stay organized and get things done with style
        </p>
        
        <div className="button-section">
          <div className="datetime-section">
            <button onClick={showDateTime} className="datetime-button">
              Show Current Date & Time
            </button>
            {currentDateTime && (
              <div className="datetime-display">
                {currentDateTime}
              </div>
            )}
          </div>

          <div className="quote-section">
            <button onClick={showRandomQuote} className="quote-button">
              Get Motivational Quote
            </button>
            {currentQuote && (
              <div className="quote-display">
                "{currentQuote}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  console.log('AppContent: Render state', { user: user?.email || 'none', loading })

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('AppContent: Showing AuthPage')
    return <AuthPage />
  }

  console.log('AppContent: Showing TaskManagerApp')
  return <TaskManagerApp />
}

function App() {
  return (
    <ErrorBoundary>
      <DebugInfo />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
