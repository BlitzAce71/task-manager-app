import { useState } from 'react'
import './App.css'

function App() {
  const [currentDateTime, setCurrentDateTime] = useState<string>('')

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

  return (
    <div className="app">
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to Taylor's Task Manager</h1>
        <p className="welcome-subtitle">
          Stay organized and get things done with style
        </p>
        
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
      </div>
    </div>
  )
}

export default App
