// app/page.tsx 
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Ambulance, 
  Heart, 
  Shield, 
  Building,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-KE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Africa/Nairobi'
      }))
    }
    
    updateTime()
    const timer = setInterval(updateTime, 30000) // Update every 30 seconds
    
    return () => clearInterval(timer)
  }, [])

  // Simple Button Component
  const Button = ({ children, href }: { children: React.ReactNode, href: string }) => (
    <Link
      href={href}
      className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl"
    >
      {children}
    </Link>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-4 py-2 font-semibold rounded-full">
                  National Emergency System
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Emergency Healthcare{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                    Coordination
                  </span>{' '}
                  for Kenya
                </h1>
                
                <p className="text-lg text-gray-600">
                  Comprehensive emergency healthcare system serving all 47 counties.
                </p>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">System Status</h3>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                    OPERATIONAL
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Current Time (EAT)</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {isClient ? currentTime : 'Loading...'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">47</div>
                      <div className="text-sm text-gray-600">Counties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">940+</div>
                      <div className="text-sm text-gray-600">Hospitals</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/login">
                  <Ambulance className="h-5 w-5 mr-2" />
                  Access Emergency Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-semibold">Emergency Notice</p>
                    <p className="text-red-700 text-sm">
                      Call <strong className="text-red-900">999 or 112</strong> for immediate help
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Ambulance, title: '999 Dispatch', color: 'text-red-600', bg: 'bg-red-50' },
                { icon: Shield, title: 'SHA Integration', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Building, title: '47 Counties', color: 'text-green-600', bg: 'bg-green-50' },
                { icon: Heart, title: 'Patient Care', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
                  <div className={`w-12 h-12 rounded-full ${feature.bg} flex items-center justify-center mx-auto mb-3`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className={`font-bold ${feature.color}`}>{feature.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">AfyaLink254</h3>
                  <p className="text-gray-400 text-sm">Emergency System</p>
                </div>
              </div>
            </div>
            
            {/* Emergency */}
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <div className="text-red-400 font-bold text-lg">
                999 / 112
              </div>
              <p className="text-gray-400 text-sm">24/7 Dispatch Center</p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/hospitals" className="hover:text-white">Hospital Directory</Link></li>
                <li><Link href="/emergency-info" className="hover:text-white">Emergency Info</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Kenya Ministry of Health</p>
          </div>
        </div>
      </footer>
    </div>
  )
}