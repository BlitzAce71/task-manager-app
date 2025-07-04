import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function DatabaseDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user) return

    const runDiagnostics = async () => {
      const logs: string[] = []
      
      try {
        logs.push(`✅ User authenticated: ${user.email} (${user.id})`)

        // Test basic connection
        const { data: connectionTest, error: connectionError } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (connectionError) {
          logs.push(`❌ Connection test failed: ${connectionError.message}`)
        } else {
          logs.push('✅ Database connection successful')
        }

        // Test user profile access
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) {
          logs.push(`❌ User profile error: ${userError.message}`)
          if (userError.code === 'PGRST116') {
            logs.push('🔧 User profile not found - this is normal for new users')
          }
        } else {
          logs.push(`✅ User profile found: ${userProfile?.email}`)
        }

        // Test categories access
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)

        if (categoriesError) {
          logs.push(`❌ Categories error: ${categoriesError.message}`)
          logs.push(`   Code: ${categoriesError.code}`)
        } else {
          logs.push(`✅ Categories accessible: ${categories?.length || 0} found`)
        }

        // Test tasks access
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)

        if (tasksError) {
          logs.push(`❌ Tasks error: ${tasksError.message}`)
          logs.push(`   Code: ${tasksError.code}`)
        } else {
          logs.push(`✅ Tasks accessible: ${tasks?.length || 0} found`)
        }

        // Test table existence
        const { data: tables, error: tablesError } = await supabase
          .rpc('get_schema_tables')
          .catch(() => null)

        if (!tablesError && tables) {
          logs.push(`✅ Tables found: ${tables.length}`)
        }

      } catch (error) {
        logs.push(`❌ Diagnostic error: ${error}`)
      }

      setDebugInfo(logs)
    }

    runDiagnostics()
  }, [user])

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
        title="Show Database Debug Info"
      >
        🔍
      </button>

      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '1rem',
          maxWidth: '400px',
          maxHeight: '400px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9998,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Database Diagnostics
          </div>
          {debugInfo.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '0.25rem',
              color: log.startsWith('❌') ? '#dc2626' : 
                    log.startsWith('✅') ? '#059669' : 
                    log.startsWith('🔧') ? '#d97706' : '#374151'
            }}>
              {log}
            </div>
          ))}
          <button
            onClick={() => setIsVisible(false)}
            style={{
              marginTop: '0.5rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}