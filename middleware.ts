// middleware.ts 
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './src/app/lib/auth'

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
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/health',
  '/api/emergency/public/',
  '/api/hospitals/public/'
]

// Helper function for middleware
function hasPermission(user: any, permission: string): boolean {
  if (!user || !user.permissions) return false
  
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  return hasPerm
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies (set by login/register APIs)
  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value
  const userPermissions = request.cookies.get('user_permissions')?.value?.split(',') || []

  console.log('🔐 Middleware check:', { pathname, hasToken: !!token, userRole })

  // Check if it's an API route
  const isApiRoute = pathname.startsWith('/api/')
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Skip middleware for public routes
  if (publicRoutes.includes(pathname) || 
      publicRoutes.some(route => pathname.startsWith(route + '/')) ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.startsWith('/favicon')) {
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
      console.log('❌ API request without token:', pathname)
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token for API routes
    try {
      const user = await verifyToken(token)
      if (!user) {
        console.log('❌ Invalid token for API:', pathname)
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.log('❌ Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token verification failed' },
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
  if (token && (pathname === '/login' || pathname === '/register')) {
    console.log('🔀 Redirecting authenticated user from auth page to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check authentication for protected routes (including /dashboard)
  if (!token) {
    console.log('🔒 No token found, redirecting to login')
    
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

  // Verify token
  let user = null
  try {
    user = await verifyToken(token)
    // Ensure permissions are set
    if (user && !user.permissions) {
      user.permissions = userPermissions
    }
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    
    // Clear invalid cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    response.cookies.delete('user_role')
    response.cookies.delete('user_permissions')
    return response
  }

  if (!user) {
    console.log('❌ No user found from token')
    
    // Clear invalid cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    response.cookies.delete('user_role')
    response.cookies.delete('user_permissions')
    return response
  }

  console.log('✅ User authenticated:', { 
    role: user.role, 
    name: user.name,
    permissions: user.permissions?.length || 0 
  })

  // Role-based access control for dashboard modules
  if (pathname.startsWith('/dashboard')) {
    // Get user's role-specific permissions
    const userRole = user.role
    
    // Define which roles can access which dashboard modules
    const roleAccess: Record<string, string[]> = {
      'SUPER_ADMIN': ['*'],
      'ADMIN': ['*'],
      'COUNTY_ADMIN': ['dashboard', 'analytics', 'hospitals', 'staff', 'settings'],
      'COUNTY_HEALTH_OFFICER': ['dashboard', 'analytics', 'hospitals', 'staff', 'settings'],
      'HOSPITAL_ADMIN': ['dashboard', 'triage', 'patients', 'transfers', 'dispatch', 'referrals', 'resources', 'procurement', 'sha-claims', 'telemedicine', 'emergencies', 'analytics', 'staff', 'hospitals', 'settings'],
      'FACILITY_MANAGER': ['dashboard', 'triage', 'patients', 'transfers', 'dispatch', 'referrals', 'resources', 'procurement', 'sha-claims', 'telemedicine', 'emergencies', 'analytics', 'staff', 'hospitals', 'settings'],
      'DOCTOR': ['dashboard', 'triage', 'patients', 'transfers', 'referrals', 'telemedicine', 'emergencies'],
      'NURSE': ['dashboard', 'triage', 'patients', 'referrals'],
      'TRIAGE_OFFICER': ['dashboard', 'triage', 'patients'],
      'DISPATCHER': ['dashboard', 'dispatch', 'ambulances', 'emergencies'],
      'AMBULANCE_DRIVER': ['dashboard', 'dispatch', 'ambulances'],
      'EMERGENCY_MANAGER': ['dashboard', 'dispatch', 'ambulances', 'emergencies'],
      'FINANCE_OFFICER': ['dashboard', 'sha-claims', 'analytics'],
      'LAB_TECHNICIAN': ['dashboard', 'patients'],
      'PHARMACIST': ['dashboard', 'patients', 'resources']
    }

    // Get allowed modules for user's role
    const allowedModules = roleAccess[userRole] || []
    
    // Check if user is trying to access a module they don't have access to
    const currentModule = pathname.split('/')[2] || 'dashboard'
    
    // SUPER_ADMIN and ADMIN can access everything
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
    
    if (!isAdmin && !allowedModules.includes('*') && currentModule && !allowedModules.includes(currentModule)) {
      console.log(`🚫 Access denied: ${userRole} cannot access ${currentModule}`)
      console.log(`📋 Allowed modules: ${allowedModules.join(', ')}`)
      
      // Redirect to dashboard home instead of unauthorized page
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Add user context to headers for downstream use
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', user.role)
  response.headers.set('x-user-email', user.email)

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}