// src/app/loading.tsx
export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-2xl">NE</span>
            </div>
            <div className="absolute -inset-4 rounded-full border-4 border-blue-200/50 animate-ping"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            National Emergency System
          </h1>
          <p className="text-gray-600 text-lg">
            Loading emergency healthcare services...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-green-500 rounded-full animate-pulse">
              <div className="h-full w-1/2 bg-white/30 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-red-800 font-medium">
            <span className="font-bold">Emergency Notice:</span> For immediate life-threatening emergencies, call{' '}
            <span className="font-bold text-red-900">999 or 112</span>
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}