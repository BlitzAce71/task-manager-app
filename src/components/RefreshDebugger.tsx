import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function RefreshDebugger() {
  const { user, session, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 RefreshDebugger: Running diagnostics...')
      
      const startTime = Date.now()
      const info: any = {
        timestamp: new Date().toISOString(),
        loadTime: startTime,
        auth: {
          loading,
          hasUser: !!user,
          hasSession: !!session,
          userId: user?.id,
          sessionValid: !!session?.access_token,
          sessionExpiry: session?.expires_at
        },
        browser: {
          isRefresh: performance.navigation?.type === 1,
          userAgent: navigator.userAgent,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled
        },
        localStorage: {
          supabaseAuth: !!localStorage.getItem('sb-piqgdivhufgfpegdrkxn-auth-token'),
          hasLocalStorage: typeof Storage !== 'undefined'
        }
      }

      setDebugInfo(info)
      console.log('🔍 RefreshDebugger: Auth state', info.auth)
      console.log('🔍 RefreshDebugger: Browser info', info.browser)
      console.log('🔍 RefreshDebugger: Storage info', info.localStorage)

      // Test Supabase connectivity
      if (user) {
        console.log('🔍 RefreshDebugger: Testing Supabase connectivity...')
        try {
          const tests: any = {
            authCheck: { status: 'pending' },
            sessionCheck: { status: 'pending' },
            dbConnectivity: { status: 'pending' },
            tasksQuery: { status: 'pending' }
          }

          // Test 1: Auth status
          try {
            const { data: authData, error: authError } = await supabase.auth.getUser()
            tests.authCheck = {
              status: authError ? 'failed' : 'passed',
              error: authError?.message,
              hasUser: !!authData.user
            }
          } catch (e: any) {
            tests.authCheck = { status: 'failed', error: e.message }
          }

          // Test 2: Session check
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            tests.sessionCheck = {
              status: sessionError ? 'failed' : 'passed',
              error: sessionError?.message,
              hasSession: !!sessionData.session,
              isExpired: sessionData.session?.expires_at ? 
                (sessionData.session.expires_at * 1000 < Date.now()) : false
            }
          } catch (e: any) {
            tests.sessionCheck = { status: 'failed', error: e.message }
          }

          // Test 3: Basic DB connectivity
          try {
            const { error: dbError } = await supabase
              .from('tasks')
              .select('count')
              .limit(1)
            tests.dbConnectivity = {
              status: dbError ? 'failed' : 'passed',
              error: dbError?.message,
              code: dbError?.code
            }
          } catch (e: any) {
            tests.dbConnectivity = { status: 'failed', error: e.message }
          }

          // Test 4: Tasks query
          try {
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .limit(5)
            tests.tasksQuery = {
              status: tasksError ? 'failed' : 'passed',
              error: tasksError?.message,
              code: tasksError?.code,
              count: tasksData?.length || 0
            }
          } catch (e: any) {
            tests.tasksQuery = { status: 'failed', error: e.message }
          }

          setTestResults(tests)
          console.log('🔍 RefreshDebugger: Test results', tests)
        } catch (error) {
          console.error('🔍 RefreshDebugger: Failed to run tests', error)
        }
      }
    }

    runDiagnostics()
  }, [user, session, loading])

  if (!import.meta.env.DEV) {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md max-h-96 overflow-auto font-mono">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <span className="font-semibold">Refresh Debugger</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-yellow-400">Auth Status:</div>
          <div>Loading: {loading ? 'true' : 'false'}</div>
          <div>User: {user ? `${user.email} (${user.id.slice(0, 8)})` : 'null'}</div>
          <div>Session: {session ? 'valid' : 'null'}</div>
        </div>

        <div>
          <div className="text-yellow-400">Browser:</div>
          <div>Is Refresh: {debugInfo.browser?.isRefresh ? 'true' : 'false'}</div>
          <div>Online: {debugInfo.browser?.onLine ? 'true' : 'false'}</div>
        </div>

        <div>
          <div className="text-yellow-400">Storage:</div>
          <div>Has Auth Token: {debugInfo.localStorage?.supabaseAuth ? 'true' : 'false'}</div>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div>
            <div className="text-yellow-400">Tests:</div>
            {Object.entries(testResults).map(([test, result]: [string, any]) => (
              <div key={test} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  result.status === 'passed' ? 'bg-green-400' : 
                  result.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                }`}></span>
                <span>{test}: {result.status}</span>
                {result.error && <span className="text-red-400">({result.error})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}