import React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="error-title">Something went wrong</h2>
        
        <p className="error-description">
          We're sorry, but something unexpected happened. Our team has been notified 
          and is working to fix the issue.
        </p>

        {import.meta.env.VITE_ENABLE_DEBUG === 'true' && (
          <details className="error-details">
            <summary>Error Details (Development Mode)</summary>
            <pre className="error-stack">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}

        <div className="error-actions">
          <button 
            onClick={resetErrorBoundary}
            className="btn btn-primary error-retry-btn"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary error-home-btn"
          >
            Go to Homepage
          </button>
        </div>

        <div className="error-help">
          <p>
            If this problem persists, please{' '}
            <a href="mailto:support@hotelbooking.com" className="error-link">
              contact our support team
            </a>
            {' '}or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  )
}
function PageErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="page-error-container">
      <div className="page-error-content">
        <h1 className="page-error-title">Oops! Something went wrong</h1>
        
        <div className="page-error-illustration">
          <svg viewBox="0 0 200 200" className="error-illustration">
            <circle cx="100" cy="100" r="80" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2"/>
            <path d="M70 70L130 130M130 70L70 130" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>

        <p className="page-error-message">
          We encountered an unexpected error while loading this page. 
          Please try again or return to the homepage.
        </p>

        <div className="page-error-actions">
          <button 
            onClick={resetErrorBoundary}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Reload Page
          </button>
          
          <a href="/" className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9L12 2L21 9V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V9Z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
function ComponentErrorFallback({ error, resetErrorBoundary, componentName = 'Component' }) {
  return (
    <div className="component-error-container">
      <div className="component-error-content">
        <div className="component-error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        
        <h4 className="component-error-title">
          Unable to load {componentName}
        </h4>
        
        <p className="component-error-message">
          This section couldn't be loaded properly.
        </p>

        <button 
          onClick={resetErrorBoundary}
          className="component-error-retry"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

function logErrorToService(error, errorInfo) {

  if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
    console.group(' Error Boundary Caught Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.groupEnd()
  }
  if (import.meta.env.VITE_SENTRY_DSN && typeof window !== 'undefined') {

    try {
      window.Sentry?.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    } catch (reportingError) {
      console.warn('Failed to report error to Sentry:', reportingError)
    }
  }
}
export function ErrorBoundary({ 
  children, 
  fallback: FallbackComponent = ErrorFallback,
  onError,
  level = 'component' // 'page', 'component', or 'app'
}) {
  const handleError = (error, errorInfo) => {
    logErrorToService(error, errorInfo)
    onError?.(error, errorInfo)
  }

  const handleReset = (details) => {
    if (typeof window !== 'undefined') {

      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('error') || key.includes('retry')) {
          sessionStorage.removeItem(key)
        }
      })
    }
  }
  let fallbackComponent = FallbackComponent
  if (level === 'page') {
    fallbackComponent = PageErrorFallback
  } else if (level === 'component') {
    fallbackComponent = (props) => <ComponentErrorFallback {...props} />
  }

  return (
    <ReactErrorBoundary
      FallbackComponent={fallbackComponent}
      onError={handleError}
      onReset={handleReset}
      resetKeys={[window.location.pathname]} // Reset on route change
    >
      {children}
    </ReactErrorBoundary>
  )
}
export function withErrorBoundary(Component, errorBoundaryConfig = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
export function useErrorHandler() {
  return (error) => {

    throw error
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason)
    if (import.meta.env.VITE_SENTRY_DSN && window.Sentry) {
      window.Sentry.captureException(event.reason)
    }
  })
}

export default ErrorBoundary