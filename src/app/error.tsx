// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Phone } from 'lucide-react'
import { Button } from './components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-8">
            {/* Emergency Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 font-heading">
                System Error
              </h1>
              <p className="text-xl text-gray-600">
                The emergency healthcare system encountered an unexpected issue
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-6 space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Emergency System Unavailable
                </h2>
                <p className="text-gray-600">
                  We apologize for the inconvenience. Our technical team has been notified and is working to restore service.
                </p>
              </div>

              {/* Critical Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Button
                  onClick={reset}
                  className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="h-14 border-2 text-lg"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Return Home
                </Button>
              </div>

              {/* Emergency Contact */}
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center space-x-3">
                  <Phone className="h-5 w-5 text-red-600" />
                  <div className="text-center">
                    <p className="text-sm text-red-800 font-medium">
                      For immediate emergencies, call:
                    </p>
                    <p className="text-xl font-bold text-red-900">
                      999 / 112
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <details className="mt-4 text-sm text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-xs">
                  {error.message || 'Unknown error occurred'}
                  {error.digest && (
                    <div className="mt-2">
                      Error ID: {error.digest}
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* Support Information */}
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>
                If this error persists, contact technical support at{' '}
                <a href="mailto:support@healthcare.go.ke" className="text-blue-600 hover:underline">
                  support@healthcare.go.ke
                </a>
              </p>
              <p>
                National Emergency Healthcare System • Kenya Ministry of Health
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}