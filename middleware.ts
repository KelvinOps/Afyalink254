import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/emergency-services',
  '/hospitals',
  '/resources',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/accessibility',
  '/help'
]

// Define API routes that are public
const publicApiRoutes = [
  '/api/auth/',
  '/api/emergency/public/',
  '/api/hospitals/public/',
  '/api/health'
]

// Define role-based route access
const roleBasedRoutes: Record<string, string[]> = {
  admin: [
    '/dashboard',
    '/admin',
    '/analytics',
    '/system-settings',
    '/user-management'
  ],
  doctor: [
    '/dashboard',
    '/patient-records',
    '/telemedicine',
    '/prescriptions'
  ],
  nurse: [
    '/dashboard',
    '/patient-care',
    '/vitals',
    '/medication'
  ],
  emergency_responder: [
    '/dashboard',
    '/dispatch',
    '/emergencies',
    '/triage'
  ],
  patient: [
    '/dashboard',
    '/my-records',
    '/appointments',
    '/prescriptions'
  ],
  staff: [
    '/dashboard',
    '/resources',
    '/reports'
  ]
}

// Routes that require specific permissions
const permissionRoutes: Record<string, string[]> = {
  'manage_users': ['/admin/users', '/user-management'],
  'view_analytics': ['/analytics', '/reports'],
  'manage_emergencies': ['/dispatch', '/emergencies'],
  'access_patient_data': ['/patient-records', '/medical-records']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value
  const userPermissions = request.cookies.get('user_permissions')?.value?.split(',') || []

  // Check if it's an API route
  const isApiRoute = pathname.startsWith('/api/')
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // Skip middleware for public routes
  if (publicRoutes.includes(pathname) || 
      publicRoutes.some(route => pathname.startsWith(route + '/')) ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  // Handle API routes
  if (isApiRoute) {
    // Allow public API routes
    if (isPublicApiRoute) {
      return NextResponse.next()
    }

    // Require authentication for protected API routes
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Add security headers for API routes
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check authentication for protected routes
  if (!token) {
    // Store the intended destination for redirect after login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('redirect_url', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300 // 5 minutes
    })
    return response
  }

  // Role-based access control
  if (userRole) {
    const allowedRoutes = roleBasedRoutes[userRole] || []
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

    if (!hasAccess && pathname.startsWith('/dashboard')) {
      // User doesn't have access to this dashboard section
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check permission-based routes
    for (const [permission, routes] of Object.entries(permissionRoutes)) {
      if (routes.some(route => pathname.startsWith(route)) && !userPermissions.includes(permission)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // Emergency mode check (if system is in emergency mode)
  const emergencyMode = request.cookies.get('emergency_mode')?.value === 'true'
  if (emergencyMode && !pathname.startsWith('/emergency/')) {
    // Redirect to emergency dashboard during emergency mode
    const isEmergencyPersonnel = ['admin', 'emergency_responder', 'doctor', 'nurse'].includes(userRole || '')
    if (isEmergencyPersonnel && !pathname.startsWith('/dashboard/emergency')) {
      return NextResponse.redirect(new URL('/dashboard/emergency', request.url))
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP Header for additional security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.healthcare.go.ke;"
  )

  // Add user context to headers for downstream use
  if (userRole) {
    response.headers.set('x-user-role', userRole)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}