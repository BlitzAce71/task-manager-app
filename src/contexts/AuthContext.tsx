import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User, type Session, type AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('AuthProvider: Initializing...')
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('AuthProvider: Session check timeout - setting loading to false')
      setLoading(false)
      setError('Authentication initialization timeout')
    }, 10000) // 10 second timeout
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(timeoutId)
      console.log('AuthProvider: Initial session check', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        error: error?.message 
      })
      
      if (error) {
        console.error('AuthProvider: Error getting session:', error)
        setError(error.message)
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((err) => {
      clearTimeout(timeoutId)
      console.error('AuthProvider: Unexpected error during session check:', err)
      setError('Failed to initialize authentication')
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed', { event, session })
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Create user profile when signing up
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Check if this is a new user (no profile exists yet)
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()
          
          if (!existingUser) {
            await createUserProfile(session.user)
          }
        } catch (err) {
          console.error('AuthProvider: Error checking/creating user profile:', err)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}