// src/app/not-found.tsx
import { Search, Home, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from './components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-2xl">
                <Search className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -inset-6 rounded-full border-4 border-blue-200/50 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gray-900 font-heading">
              404
            </h1>
            <h2 className="text-3xl font-bold text-gray-800 font-heading">
              Page Not Found
            </h2>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              The emergency resource you&apos;re looking for is not available or has been moved.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 overflow-hidden">
          {/* Emergency Alert */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
            <div className="flex items-center justify-center space-x-3">
              <Phone className="h-5 w-5" />
              <p className="font-semibold text-lg">
                For medical emergencies, call <strong>999 or 112</strong> immediately
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Suggested Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                What you can do:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/" className="block">
                  <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg">
                    <Home className="h-5 w-5 mr-2" />
                    Return to Dashboard
                  </Button>
                </Link>
                
                <Link href="/hospitals" className="block">
                  <Button variant="outline" className="w-full h-14 border-2 text-lg">
                    <MapPin className="h-5 w-5 mr-2" />
                    Find Hospitals
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Quick Access:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Link href="/triage" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Triage Center
                </Link>
                <Link href="/dispatch" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Emergency Dispatch
                </Link>
                <Link href="/patients" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Patient Records
                </Link>
                <Link href="/emergencies" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Active Emergencies
                </Link>
              </div>
            </div>

            {/* Search Suggestion */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> Use the search function in the dashboard to quickly find patients, resources, or facilities.
              </p>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="text-center space-y-3">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <div>
              <p className="font-semibold">Technical Support</p>
              <a href="mailto:support@healthcare.go.ke" className="text-blue-600 hover:underline">
                support@healthcare.go.ke
              </a>
            </div>
            <div>
              <p className="font-semibold">Emergency Hotline</p>
              <p className="text-red-600 font-bold">999 / 112</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-400">
            National Emergency Healthcare System • Serving all 47 Counties of Kenya
          </p>
        </div>
      </div>
    </div>
  )
}