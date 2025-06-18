import React from 'react'

// Primary loading spinner component
const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  text,
  className = '',
  fullScreen = false,
  overlay = false
}) => {
  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium', 
    large: 'loading-spinner-large'
  }

  const colorClasses = {
    primary: 'loading-spinner-primary',
    secondary: 'loading-spinner-secondary',
    white: 'loading-spinner-white',
    accent: 'loading-spinner-accent'
  }

  const spinnerClass = `loading-spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`

  const spinner = (
    <div className={spinnerClass}>
      <div className="loading-spinner-circle">
        <div className="loading-spinner-path"></div>
      </div>
      {text && <div className="loading-spinner-text">{text}</div>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {spinner}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="loading-overlay">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Page loading component with hotel-themed animation
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="page-loader">
    <div className="page-loader-content">
      <div className="hotel-loader">
        <div className="hotel-building">
          <div className="hotel-floor"></div>
          <div className="hotel-floor"></div>
          <div className="hotel-floor"></div>
          <div className="hotel-windows">
            <div className="window"></div>
            <div className="window"></div>
            <div className="window"></div>
            <div className="window"></div>
          </div>
        </div>
        <div className="hotel-door"></div>
      </div>
      <div className="page-loader-text">{message}</div>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
)

// Button loading state
export const ButtonLoader = ({ size = 'small' }) => (
  <div className={`button-loader button-loader-${size}`}>
    <div className="button-spinner"></div>
  </div>
)

// Card loading skeleton
export const CardSkeleton = ({ lines = 3, showImage = true }) => (
  <div className="card-skeleton">
    {showImage && <div className="skeleton-image"></div>}
    <div className="skeleton-content">
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i} 
          className={`skeleton-line ${i === lines - 1 ? 'skeleton-line-short' : ''}`}
        ></div>
      ))}
    </div>
  </div>
)

// Room card loading skeleton
export const RoomCardSkeleton = () => (
  <div className="room-card-skeleton">
    <div className="skeleton-room-image"></div>
    <div className="skeleton-room-content">
      <div className="skeleton-room-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-price"></div>
      </div>
      <div className="skeleton-room-details">
        <div className="skeleton-line"></div>
        <div className="skeleton-line skeleton-line-short"></div>
      </div>
      <div className="skeleton-room-features">
        <div className="skeleton-feature"></div>
        <div className="skeleton-feature"></div>
        <div className="skeleton-feature"></div>
      </div>
      <div className="skeleton-room-actions">
        <div className="skeleton-button"></div>
      </div>
    </div>
  </div>
)

// Search results loading
export const SearchResultsSkeleton = ({ count = 6 }) => (
  <div className="search-results-skeleton">
    <div className="skeleton-search-header">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-subtitle"></div>
    </div>
    <div className="skeleton-filters">
      <div className="skeleton-filter"></div>
      <div className="skeleton-filter"></div>
      <div className="skeleton-filter"></div>
    </div>
    <div className="skeleton-results-grid">
      {Array.from({ length: count }, (_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

// Booking form loading
export const BookingFormSkeleton = () => (
  <div className="booking-form-skeleton">
    <div className="skeleton-form-section">
      <div className="skeleton-section-title"></div>
      <div className="skeleton-form-row">
        <div className="skeleton-input"></div>
        <div className="skeleton-input"></div>
      </div>
      <div className="skeleton-form-row">
        <div className="skeleton-input skeleton-input-full"></div>
      </div>
    </div>
    <div className="skeleton-form-section">
      <div className="skeleton-section-title"></div>
      <div className="skeleton-form-row">
        <div className="skeleton-input"></div>
        <div className="skeleton-input"></div>
      </div>
    </div>
    <div className="skeleton-form-actions">
      <div className="skeleton-button skeleton-button-secondary"></div>
      <div className="skeleton-button skeleton-button-primary"></div>
    </div>
  </div>
)

// Dashboard loading
export const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-dashboard-header">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-welcome">
        <div className="skeleton-line skeleton-name"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
      </div>
    </div>
    <div className="skeleton-dashboard-tabs">
      <div className="skeleton-tab active"></div>
      <div className="skeleton-tab"></div>
    </div>
    <div className="skeleton-dashboard-content">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="skeleton-booking-card">
          <div className="skeleton-booking-header">
            <div className="skeleton-line skeleton-booking-title"></div>
            <div className="skeleton-status"></div>
          </div>
          <div className="skeleton-booking-details">
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-line-short"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Inline loading text
export const InlineLoader = ({ text = 'Loading', color = 'primary' }) => (
  <span className={`inline-loader inline-loader-${color}`}>
    {text}
    <span className="inline-dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  </span>
)

// Progress bar loader
export const ProgressLoader = ({ progress = 0, text, showPercentage = true }) => (
  <div className="progress-loader">
    {text && <div className="progress-text">{text}</div>}
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
    {showPercentage && (
      <div className="progress-percentage">{Math.round(progress)}%</div>
    )}
  </div>
)

// Lazy loading wrapper
export const LazyLoader = ({ children, placeholder, isLoading = false }) => {
  if (isLoading) {
    return placeholder || <LoadingSpinner />
  }
  return children
}

export default LoadingSpinner