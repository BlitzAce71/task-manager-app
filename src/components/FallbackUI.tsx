import { type ReactNode } from 'react'

interface FallbackUIProps {
  onRetry?: () => void
  children?: ReactNode
  type?: 'error' | 'empty' | 'offline'
  title?: string
  message?: string
}

export function FallbackUI({ 
  onRetry, 
  children, 
  type = 'error',
  title,
  message 
}: FallbackUIProps) {
  const getContent = () => {
    switch (type) {
      case 'offline':
        return {
          icon: (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l6.364 6.364a9 9 0 010 7.272L12 21.82l-6.364-6.364a9 9 0 010-7.272L12 2.18z" />
            </svg>
          ),
          title: title || 'You\'re offline',
          message: message || 'Please check your internet connection and try again.',
          bgColor: 'bg-gray-100',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        }
      case 'empty':
        return {
          icon: (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: title || 'No data available',
          message: message || 'There\'s nothing to show here yet.',
          bgColor: 'bg-gray-100',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      default:
        return {
          icon: (
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: title || 'Something went wrong',
          message: message || 'Unable to load data. Please try again.',
          bgColor: 'bg-orange-100',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        }
    }
  }

  const content = getContent()

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={`w-16 h-16 ${content.bgColor} rounded-full flex items-center justify-center mb-4`}>
        {content.icon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {content.message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className={`${content.buttonColor} text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
        >
          Try Again
        </button>
      )}
      
      {children}
    </div>
  )
}

// Specific fallback components for common scenarios
export function DataLoadingFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackUI
      type="error"
      title="Unable to load data"
      message="We're having trouble loading your information. Please try again."
      onRetry={onRetry}
    />
  )
}

export function OfflineFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackUI
      type="offline"
      onRetry={onRetry}
    />
  )
}

export function EmptyDataFallback({ message, children }: { message?: string; children?: ReactNode }) {
  return (
    <FallbackUI
      type="empty"
      message={message}
    >
      {children}
    </FallbackUI>
  )
}