// /app/lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { hasPermission } from './permissions'

export interface AuthenticatedRequest extends NextRequest {
  user?: any
}

export async function authenticateRequest(request: NextRequest): Promise<{
  user: any | null
  response: NextResponse | null
}> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
  }

  const token = authHeader.substring(7)
  const user = await verifyToken(token)
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      )
    }
  }

  return { user, response: null }
}

export function requireRole(user: any, allowedRoles: string[]): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Insufficient permissions',
        userRole: user.role,
        allowedRoles
      },
      { status: 403 }
    )
  }
  
  return null
}

export function requirePermission(user: any, permission: string): NextResponse | null {
  if (!hasPermission(user, permission)) {
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Missing required permission',
        requiredPermission: permission,
        userPermissions: user.permissions
      },
      { status: 403 }
    )
  }
  
  return null
}