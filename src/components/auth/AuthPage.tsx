import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import './Auth.css'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {isSignUp ? (
            <SignUpForm onToggleMode={toggleMode} />
          ) : (
            <SignInForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  )
}