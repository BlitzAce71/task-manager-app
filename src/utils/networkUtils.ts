interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoffMultiplier?: number
  retryCondition?: (error: Error) => boolean
}

interface NetworkError extends Error {
  code?: string
  status?: number
  isNetworkError?: boolean
  isTimeout?: boolean
}

// Enhanced fetch with retry mechanism
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => isRetryableError(error)
  } = retryOptions

  let lastError: NetworkError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as NetworkError
        error.status = response.status
        error.isNetworkError = true
        
        if (response.status >= 500 || response.status === 429) {
          throw error // These are retryable
        }
        
        throw error // Client errors (4xx) are not retryable
      }

      return response
    } catch (error) {
      const networkError = error as NetworkError
      
      if (networkError.name === 'AbortError') {
        networkError.isTimeout = true
        networkError.message = 'Request timed out'
      }
      
      networkError.isNetworkError = true
      lastError = networkError

      if (attempt === maxAttempts || !retryCondition(networkError)) {
        throw networkError
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Check if error is retryable
function isRetryableError(error: NetworkError): boolean {
  // Network errors
  if (error.isTimeout) return true
  if (error.message?.includes('Failed to fetch')) return true
  if (error.message?.includes('NetworkError')) return true
  
  // Server errors (5xx) and rate limiting (429)
  if (error.status && (error.status >= 500 || error.status === 429)) return true
  
  return false
}

// Get user-friendly error message
export function getErrorMessage(error: NetworkError): string {
  if (error.isTimeout) {
    return 'Request timed out. Please check your connection and try again.'
  }
  
  if (error.message?.includes('Failed to fetch')) {
    return 'Unable to connect. Please check your internet connection.'
  }
  
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'You need to sign in to continue.'
      case 403:
        return 'You don\'t have permission to do this.'
      case 404:
        return 'The requested resource was not found.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. We\'re working to fix this.'
      case 503:
        return 'Service temporarily unavailable. Please try again later.'
      default:
        if (error.status >= 500) {
          return 'Server error. Please try again later.'
        }
        return 'Something went wrong. Please try again.'
    }
  }
  
  return 'Something went wrong. Please try again.'
}

// Check if user is online
export function isOnline(): boolean {
  return navigator.onLine
}

// Listen for online/offline events
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Track user actions for error reporting
export function trackUserAction(action: string, data?: any) {
  try {
    const actions = JSON.parse(localStorage.getItem('recentActions') || '[]')
    const newAction = {
      action,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    actions.push(newAction)
    
    // Keep only last 10 actions
    if (actions.length > 10) {
      actions.shift()
    }
    
    localStorage.setItem('recentActions', JSON.stringify(actions))
  } catch (error) {
    console.warn('Failed to track user action:', error)
  }
}

// Clear old actions
export function clearOldActions() {
  try {
    const actions = JSON.parse(localStorage.getItem('recentActions') || '[]')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentActions = actions.filter((action: any) => 
      new Date(action.timestamp) > oneHourAgo
    )
    
    localStorage.setItem('recentActions', JSON.stringify(recentActions))
  } catch (error) {
    console.warn('Failed to clear old actions:', error)
  }
}