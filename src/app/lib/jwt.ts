// app/lib/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose'

// Use the same secret as in auth.ts
export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-123456'
)

// Define the structure of your JWT payload
export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  role: string
  hospitalId?: string
  facilityType?: string
  name?: string
  iat?: number
  exp?: number
}

export async function createToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  return token
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// For backward compatibility
export const signToken = createToken