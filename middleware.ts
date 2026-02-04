// /middleware.ts - CORRECTED VERSION
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
  '/help',
  '/unauthorized'
]

// Define API routes that are public
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/health',
  '/api/emergency/public/',
  '/api/hospitals/public/'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // Skip files with extensions
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Check if it's an API route
  const isApiRoute = pathname.startsWith('/api/')
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Handle API routes
  if (isApiRoute) {
    // Allow public API routes without authentication
    if (isPublicApiRoute) {
      return NextResponse.next()
    }

    // For protected API routes, check auth_token cookie
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // Check if it's a public page
  const isPublicPage = publicRoutes.includes(pathname) || 
                      publicRoutes.some(route => pathname.startsWith(route + '/'))

  if (isPublicPage) {
    // If user is authenticated and tries to access login/register, redirect to dashboard
    const token = request.cookies.get('auth_token')?.value
    if (token && (pathname === '/login' || pathname === '/register')) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
    
    return NextResponse.next()
  }

  // Require authentication for all other routes (like /dashboard)
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}