import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '20px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              The application encountered an error. Please refresh the page or try again later.
            </p>
            <details style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Error details
              </summary>
              <pre style={{
                background: '#f7fafc',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.8rem',
                marginTop: '0.5rem'
              }}>
                {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}