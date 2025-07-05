import { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  width?: number | string
  height?: number | string
  loading?: 'lazy' | 'eager'
  sizes?: string
  srcSet?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  width,
  height,
  loading = 'lazy',
  sizes,
  srcSet,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const shouldLoad = loading === 'eager' || inView

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder or loading state */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          )}
        </div>
      )}

      {/* Main image */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={{ width, height }}
          sizes={sizes}
          srcSet={srcSet}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📷</div>
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for creating responsive image sizes
export function useResponsiveImageSizes(breakpoints: { [key: string]: number }) {
  const sizes = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a) // Sort by width descending
    .map(([breakpoint, width], index, array) => {
      if (index === array.length - 1) {
        return `${width}px` // Last item doesn't need media query
      }
      return `(min-width: ${breakpoint}) ${width}px`
    })
    .join(', ')

  return sizes
}

// Utility for generating srcSet for different densities
export function generateSrcSet(baseSrc: string, densities: number[] = [1, 2, 3]) {
  const extension = baseSrc.split('.').pop()
  const baseName = baseSrc.replace(`.${extension}`, '')
  
  return densities
    .map(density => {
      if (density === 1) return `${baseSrc} 1x`
      return `${baseName}@${density}x.${extension} ${density}x`
    })
    .join(', ')
}