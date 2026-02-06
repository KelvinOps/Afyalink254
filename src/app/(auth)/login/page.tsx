// /app/(auth)/login/page.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext' 
import { 
  Ambulance, 
  Shield, 
  User, 
  Stethoscope, 
  Building, 
  MapPin,
  Phone,
  AlertTriangle,
  Heart,
  Lock,
  Mail,
  ClipboardList,
  Activity,
  BriefcaseMedical
} from 'lucide-react'

// Move demo users outside component to prevent recreation
const DEMO_USERS = [
  { 
    email: 'superadmin@health.go.ke', 
    password: 'demo123', 
    role: 'SUPER_ADMIN', 
    name: 'Super Admin',
    icon: Shield,
    description: 'Full system access and administration',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    email: 'countyadmin@health.go.ke', 
    password: 'demo123', 
    role: 'COUNTY_ADMIN', 
    name: 'County Administrator',
    icon: MapPin,
    description: 'County-level management and oversight',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    email: 'hospitaladmin@health.go.ke', 
    password: 'demo123', 
    role: 'HOSPITAL_ADMIN', 
    name: 'Hospital Administrator',
    icon: Building,
    description: 'Hospital operations and resource management',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    email: 'doctor@health.go.ke', 
    password: 'demo123', 
    role: 'DOCTOR', 
    name: 'Medical Doctor',
    icon: Stethoscope,
    description: 'Patient care and medical operations',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    email: 'nurse@health.go.ke', 
    password: 'demo123', 
    role: 'NURSE', 
    name: 'Nursing Staff',
    icon: Activity,
    description: 'Patient care and clinical support',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    email: 'triage@health.go.ke', 
    password: 'demo123', 
    role: 'TRIAGE_OFFICER', 
    name: 'Triage Officer',
    icon: ClipboardList,
    description: 'Patient assessment and prioritization',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    email: 'dispatch@health.go.ke', 
    password: 'demo123', 
    role: 'DISPATCH_COORDINATOR', 
    name: 'Dispatch Coordinator',
    icon: Phone,
    description: 'Emergency response coordination',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    email: 'ambulance@health.go.ke', 
    password: 'demo123', 
    role: 'AMBULANCE_CREW', 
    name: 'Ambulance Crew',
    icon: Ambulance,
    description: 'Emergency transport and field care',
    color: 'from-red-500 to-red-600'
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  // Redirect if already authenticated
  useEffect(() => {
    if (user && isInitialized) {
      router.push(redirectUrl)
    }
  }, [user, isInitialized, redirectUrl, router])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting login for:', email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      // Success - redirect to dashboard
      window.location.href = redirectUrl
    } catch (error) {
      console.error('❌ Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.')
      setIsLoading(false)
    }
  }, [email, password, isLoading, redirectUrl])

  const fillDemoCredentials = useCallback((demoUser: typeof DEMO_USERS[0]) => {
    setEmail(demoUser.email)
    setPassword(demoUser.password)
    setSelectedRole(demoUser.role)
  }, [])

  // Show loading during initial auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AfyaLink254</h1>
                <p className="text-sm text-gray-600">Emergency System</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">
              Sign in to access the National Emergency Healthcare System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in to System'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">
                  Demo Access
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                Select a demo account
              </p>
              
              <div className="space-y-3">
                {DEMO_USERS.map((demoUser) => {
                  const IconComponent = demoUser.icon
                  return (
                    <button
                      key={demoUser.role}
                      type="button"
                      onClick={() => fillDemoCredentials(demoUser)}
                      className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                        selectedRole === demoUser.role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${demoUser.color} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {demoUser.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {demoUser.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Password:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">demo123</code>
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <Link 
                href="/register" 
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Request account access
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link 
                href="/forgot-password" 
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="flex-1 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">National Emergency System</h1>
                <p className="text-blue-100">Ministry of Health, Kenya</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <h2 className="text-3xl font-bold leading-tight">
                Coordinating Emergency Healthcare Across Kenya
              </h2>
              <p className="mt-4 text-blue-100 leading-relaxed">
                Real-time emergency response, patient coordination, and healthcare resource management.
              </p>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="font-semibold">Emergency Notice</p>
                <p className="text-blue-100 text-sm">
                  For life-threatening emergencies, call <strong>999 or 112</strong> immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}