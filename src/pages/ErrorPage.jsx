import { Home, RefreshCcw } from 'lucide-react'

const ErrorPage = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-8">
          <RefreshCcw className="w-12 h-12 text-orange-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg text-left">
            <p className="text-xs font-mono text-red-600 break-all">{error.message}</p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
