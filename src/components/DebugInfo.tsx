import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function DebugInfo() {
  const [dbStatus, setDbStatus] = useState<string>('Checking...')
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test basic connection
        const { error } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (error) {
          setDbStatus(`Database Error: ${error.message}`)
        } else {
          setDbStatus('Database Connected ✓')
        }
      } catch (err) {
        setDbStatus(`Connection Error: ${err}`)
      }
    }
    
    checkConnection()
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</div>
      <div>DB Status: {dbStatus}</div>
    </div>
  )
}