import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  eventId?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({
      error,
      errorInfo,
      eventId,
    })

    // Only log detailed errors in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    } else {
      // In production, log minimal error info
      console.error('Application error occurred:', {
        message: error.message,
        eventId,
        timestamp: new Date().toISOString(),
      })
      
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      // Example: Sentry.captureException(error, { contexts: { errorInfo } })
    }
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      eventId: undefined 
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              {this.state.eventId && (
                <p className="text-xs text-gray-500 mb-4">
                  Error ID: {this.state.eventId}
                </p>
              )}
            </div>

            {/* Only show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                  Show Error Details (Development)
                </summary>
                <div className="mt-3 p-4 bg-red-50 rounded-lg border">
                  <h4 className="font-semibold text-red-800 mb-2">Error Message:</h4>
                  <p className="text-sm text-red-700 mb-3">{this.state.error.message}</p>
                  
                  {this.state.error.stack && (
                    <>
                      <h4 className="font-semibold text-red-800 mb-2">Stack Trace:</h4>
                      <pre className="text-xs text-red-600 overflow-auto max-h-32 bg-white p-2 rounded border">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <h4 className="font-semibold text-red-800 mb-2 mt-3">Component Stack:</h4>
                      <pre className="text-xs text-red-600 overflow-auto max-h-24 bg-white p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based error handler for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    const eventId = `runtime-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (import.meta.env.DEV) {
      console.error('Runtime error:', error, errorInfo)
    } else {
      console.error('Runtime error occurred:', {
        message: error.message,
        eventId,
        timestamp: new Date().toISOString(),
      })
      
      // TODO: Send to error reporting service
    }
  }
}