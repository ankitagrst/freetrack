import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h3 className="text-lg font-bold text-red-600">Something went wrong</h3>
          <p className="text-sm text-gray-600 mt-2">An unexpected error occurred in this view. Please try reloading the page.</p>
          <div className="mt-4">
            <button onClick={() => window.location.reload()} className="btn btn-primary">Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
