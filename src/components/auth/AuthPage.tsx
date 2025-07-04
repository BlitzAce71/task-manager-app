import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-8">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
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