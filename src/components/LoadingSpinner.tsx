interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 ${className}`}>
      <div className="text-center text-white">
        <div className={`${sizeClasses[size]} border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-lg">{text}</p>
      </div>
    </div>
  )
}