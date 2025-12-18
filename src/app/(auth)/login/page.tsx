// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Mail
} from 'lucide-react'

// Demo users for different roles
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
    color: 'from-blue-500 to-blue-600'
  },
  { 
    email: 'hospitaladmin@health.go.ke', 
    password: 'demo123', 
    role: 'HOSPITAL_ADMIN', 
    name: 'Hospital Administrator',
    icon: Building,
    description: 'Hospital facility management',
    color: 'from-green-500 to-green-600'
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
    icon: User,
    description: 'Patient care and triage support',
    color: 'from-pink-500 to-pink-600'
  },
  { 
    email: 'triage@health.go.ke', 
    password: 'demo123', 
    role: 'TRIAGE_OFFICER', 
    name: 'Triage Officer',
    icon: AlertTriangle,
    description: 'Emergency patient assessment',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    email: 'dispatcher@health.go.ke', 
    password: 'demo123', 
    role: 'DISPATCHER', 
    name: 'Dispatch Coordinator',
    icon: Phone,
    description: 'Ambulance and resource coordination',
    color: 'from-red-500 to-red-600'
  },
  { 
    email: 'ambulance@health.go.ke', 
    password: 'demo123', 
    role: 'AMBULANCE_DRIVER', 
    name: 'Ambulance Crew',
    icon: Ambulance,
    description: 'Emergency transport services',
    color: 'from-yellow-500 to-yellow-600'
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const { login, user, isInitialized } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useState(() => {
    if (user && isInitialized) {
      router.push('/dashboard')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      // The login function will handle the redirect to dashboard
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (demoUser: typeof DEMO_USERS[0]) => {
    setEmail(demoUser.email)
    setPassword(demoUser.password)
    setSelectedRole(demoUser.role)
  }

  // Don't show login page if user is already authenticated
  if (user && isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          {/* Logo and Header */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency System</h1>
                <p className="text-sm text-gray-600">Kenya MOH</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-lg text-gray-600">
              Sign in to access the National Emergency Healthcare System
            </p>
          </div>

          {/* Login Form */}
          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Enter your official email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember this device
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    href="/forgot-password" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

            {/* Demo Credentials Section */}
            <div className="mt-10">
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
                  Select a role to automatically fill credentials
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                  {DEMO_USERS.map((demoUser) => {
                    const IconComponent = demoUser.icon
                    return (
                      <button
                        key={demoUser.role}
                        type="button"
                        onClick={() => fillDemoCredentials(demoUser)}
                        className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                          selectedRole === demoUser.role
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${demoUser.color} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {demoUser.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {demoUser.description}
                            </p>
                            <div className="mt-2">
                              <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-mono">
                                {demoUser.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 bg-gray-50 py-2 px-3 rounded-lg border">
                    <span className="font-semibold">Password for all demo accounts:</span>{' '}
                    <code className="bg-gray-200 px-1 py-0.5 rounded">demo123</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Need access to the system?{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Request account access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding and Information */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="flex-1 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">National Emergency System</h1>
                <p className="text-blue-100">Ministry of Health, Kenya</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <h2 className="text-4xl font-bold leading-tight">
                Coordinating Emergency Healthcare Across Kenya
              </h2>
              <p className="mt-4 text-lg text-blue-100 leading-relaxed">
                Real-time emergency response, patient coordination, and healthcare resource management for all 47 counties.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-6 mt-16">
            <div className="flex items-center space-x-3">
              <Ambulance className="w-6 h-6 text-blue-200" />
              <span className="text-blue-100 font-medium">Emergency Dispatch</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-200" />
              <span className="text-blue-100 font-medium">SHA Integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-blue-200" />
              <span className="text-blue-100 font-medium">47 Counties</span>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-blue-200" />
              <span className="text-blue-100 font-medium">940+ Facilities</span>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="mt-12 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
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