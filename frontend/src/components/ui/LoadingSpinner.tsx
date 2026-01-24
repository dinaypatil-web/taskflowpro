import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'gradient' | 'dots'
}

export function LoadingSpinner({ size = 'md', className, variant = 'gradient' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-bounce',
              sizeClasses[size]
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin">
          <div className="absolute inset-1 rounded-full bg-white" />
        </div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-200',
        'border-t-blue-500 border-r-purple-500',
        sizeClasses[size],
        className
      )}
    />
  )
}