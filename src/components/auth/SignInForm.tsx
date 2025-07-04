import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface SignInFormProps {
  onToggleMode: () => void
}

export function SignInForm({ onToggleMode }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()

  const validateForm = () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (error.message?.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.')
        } else if (error.message?.includes('Too many requests')) {
          setError('Too many sign-in attempts. Please wait a moment and try again.')
        } else {
          setError(error.message || 'An error occurred during sign in')
        }
      }
      // If successful, the auth context will handle the state change
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your Task Manager account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-semibold text-gray-800 text-sm">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
            autoComplete="email"
            className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-semibold text-gray-800 text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            autoComplete="current-password"
            className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-700 text-white border-none px-4 py-4 rounded-lg text-lg font-semibold cursor-pointer transition-all duration-300 mt-2 hover:transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center pt-6 border-t border-gray-200 mt-6">
        <p className="text-gray-600 m-0">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            disabled={loading}
            className="bg-none border-none text-blue-500 font-semibold cursor-pointer underline text-base hover:text-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}