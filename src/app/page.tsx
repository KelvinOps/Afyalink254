// app/page.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Ambulance, 
  Heart, 
  Shield, 
  Users, 
  MapPin, 
  Phone, 
  Clock,
  AlertTriangle,
  Stethoscope,
  Building,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation' // Import useRouter

// Mock data for system stats
const systemStats = [
  { 
    label: 'Hospitals Connected', 
    value: '940+', 
    icon: Building, 
    change: '+12',
    changeType: 'positive' as const,
    color: 'bg-blue-500'
  },
  { 
    label: 'Active Emergencies', 
    value: '8', 
    icon: AlertTriangle, 
    change: '-2',
    changeType: 'negative' as const,
    color: 'bg-red-500'
  },
  { 
    label: 'Patients Today', 
    value: '2,847', 
    icon: Users, 
    change: '+247',
    changeType: 'positive' as const,
    color: 'bg-green-500'
  },
  { 
    label: 'Avg Response Time', 
    value: '4.2min', 
    icon: Clock, 
    change: '-0.8min',
    changeType: 'positive' as const,
    color: 'bg-purple-500'
  },
]

const features = [
  {
    icon: Ambulance,
    title: '999/911 Emergency Dispatch',
    description: 'Real-time ambulance coordination and emergency response across all 47 counties',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-600'
  },
  {
    icon: Shield,
    title: 'SHA/SHIF Integration',
    description: 'Seamless claims processing and financial management for universal healthcare coverage',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600'
  },
  {
    icon: Stethoscope,
    title: 'Digital Triage System',
    description: 'AI-powered patient prioritization and queue management for emergency departments',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-green-600'
  },
  {
    icon: MapPin,
    title: 'National Coverage',
    description: 'Comprehensive healthcare network serving urban and rural communities across Kenya',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-600'
  }
]

const emergencyContacts = [
  { 
    name: 'Emergency Hotline', 
    number: '999 / 112', 
    description: '24/7 National Dispatch',
    icon: Phone 
  },
  { 
    name: 'Ambulance Dispatch', 
    number: '0700 000 000', 
    description: 'Direct Ambulance Request',
    icon: Ambulance 
  },
  { 
    name: 'Poison Control', 
    number: '0100 000 000', 
    description: 'Toxicology Emergency',
    icon: AlertTriangle 
  },
]

const footerLinks = {
  quickLinks: [
    { label: 'Hospital Directory', href: '/hospitals' },
    { label: 'Emergency Info', href: '/emergency-info' },
    { label: 'SHA Claims', href: '/sha-claims' },
    { label: 'Resources', href: '/resources' },
  ],
  supportLinks: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Training', href: '/training' },
    { label: 'System Status', href: '/status' },
  ]
}

// Define Button variant types
type ButtonVariant = 'primary' | 'secondary' | 'outline'

// Button Props Interface - UPDATED
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  className?: string
  as?: 'button' | 'a'
  href?: string
}

// Simple Button Component with TypeScript - UPDATED
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  as = 'button',
  href,
  ...props 
}: ButtonProps) => {
  const router = useRouter()
  
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 hover:shadow-md'
  };
  
  const buttonClasses = `${baseStyles} ${variants[variant]} ${className}`;
  
  const handleClick = (e: React.MouseEvent) => {
    if (href && as === 'button') {
      e.preventDefault()
      router.push(href)
    }
    onClick?.()
  }
  
  if (as === 'a' && href) {
    return (
      <Link 
        href={href} 
        className={buttonClasses}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }
  
  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Card Props Interface
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

// Simple Card Component
const Card = ({ children, className = '', ...props }: CardProps) => (
  <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow ${className}`} {...props}>
    {children}
  </div>
)

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [systemStatus] = useState({
    operational: true,
    uptime: '99.8%',
    responseTime: '4.2min'
  })

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Simulate emergency mode during certain hours for demo
      const hour = new Date().getHours()
      setIsEmergencyMode(hour >= 8 && hour <= 20) // 8 AM to 8 PM
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Emergency Alert Banner Component
  const EmergencyAlertBanner = () => {
    if (!isEmergencyMode) return null
    
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 text-center font-semibold animate-pulse">
        <div className="container mx-auto flex items-center justify-center space-x-3">
          <AlertTriangle className="h-5 w-5" />
          <span>EMERGENCY MODE ACTIVE - System operating at maximum capacity</span>
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    )
  }

  // System Status Card Component
  const SystemStatusCard = () => (
    <Card className="p-6 border-2 border-blue-200 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">System Status</h3>
          <p className="text-sm text-gray-600">National Emergency Network</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${systemStatus.operational ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {systemStatus.operational ? 'OPERATIONAL' : 'DEGRADED'}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Current Time (EAT)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatTime(currentTime)}</div>
          <div className="text-sm text-gray-500">{currentTime ? formatDate(currentTime) : ''}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {systemStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Emergency Alert Banner */}
      <EmergencyAlertBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-green-500/10"></div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center bg-blue-100 text-blue-800 border border-blue-200 text-sm px-4 py-2 font-semibold rounded-full animate-pulse">
                  National Emergency System
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Emergency Healthcare{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                    Coordination
                  </span>{' '}
                  for Kenya
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Comprehensive emergency healthcare system serving all 47 counties with 
                  real-time response capabilities, SHA/SHIF integration, and advanced 
                  telemedicine services.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Card className="text-center p-4 border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">47</div>
                  <div className="text-sm text-gray-600">Counties</div>
                </Card>
                <Card className="text-center p-4 border-green-100">
                  <div className="text-2xl font-bold text-green-600">940+</div>
                  <div className="text-sm text-gray-600">Hospitals</div>
                </Card>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="text-lg px-8 py-4 font-semibold"
                  href="/login"
                  as="a" // Use 'a' for proper Link component
                >
                  <Ambulance className="h-5 w-5 mr-2" />
                  Access Emergency Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="text-lg px-8 py-4 font-semibold"
                  href="/hospitals"
                  as="a"
                >
                  <Building className="h-5 w-5 mr-2" />
                  Find Hospitals
                </Button>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-red-800 font-semibold">Emergency Notice</p>
                    <p className="text-red-700 text-sm">
                      For life-threatening emergencies, always call{' '}
                      <strong className="text-red-900">999 or 112</strong> immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <SystemStatusCard />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center border border-blue-300 text-blue-700 bg-blue-50 text-sm px-4 py-2 rounded-full mb-4 font-semibold">
              Comprehensive Solutions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Addressing Kenya&apos;s Healthcare Challenges
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our integrated platform solves critical healthcare delivery issues across all 47 counties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 rounded-full ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contacts Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Emergency Contacts
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Immediate assistance available 24/7 across all counties
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {emergencyContacts.map((contact, index) => (
              <Card key={index} className="p-6 text-center border-2 border-white/20">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <contact.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{contact.name}</h3>
                <p className="text-2xl font-bold mb-2">{contact.number}</p>
                <p className="text-blue-100">{contact.description}</p>
              </Card>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary"
                className="text-lg px-8 py-4 font-semibold"
                href="/dispatch"
                as="a"
              >
                <Ambulance className="h-5 w-5 mr-2" />
                Request Ambulance
              </Button>
              
              <Button 
                variant="outline"
                className="text-lg px-8 py-4 font-semibold border-white text-white hover:bg-white/20"
                href="/emergency-info"
                as="a"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Procedures
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-blue-600">47/47</div>
              <div className="text-gray-600 mt-2">Counties Covered</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-green-600">99.8%</div>
              <div className="text-gray-600 mt-2">System Uptime</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-purple-600">2.4M+</div>
              <div className="text-gray-600 mt-2">Patients Served</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-orange-600">4.2min</div>
              <div className="text-gray-600 mt-2">Avg Response Time</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AfyaLink254</h3>
                  <p className="text-gray-400 text-sm">Emergency System • Kenya MOH</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive emergency healthcare coordination system serving all 47 counties.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {footerLinks.quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {footerLinks.supportLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <div className="space-y-2 text-sm">
                <div className="text-red-400 font-bold text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>999 / 112</span>
                </div>
                <p className="text-gray-400">24/7 Dispatch Center</p>
                <div className="pt-4">
                  <p className="text-gray-400 text-xs">
                    © {new Date().getFullYear()} Kenya Ministry of Health
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Last updated: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}