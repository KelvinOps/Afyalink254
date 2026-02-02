// app/lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose'

// Use the same secret as in auth.ts
export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-123456'
)

export async function createToken(payload: any): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  return token
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// For backward compatibility
export const signToken = createToken