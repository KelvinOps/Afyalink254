//app/utils/debug.ts

export function debugAuth() {
  const token = localStorage.getItem('accessToken')
  const user = localStorage.getItem('user')
  
  console.group('🔐 Auth Debug Info')
  console.log('Token exists:', !!token)
  if (token) {
    console.log('Token length:', token.length)
    console.log('Token preview:', token.substring(0, 50) + '...')
  }
  console.log('User exists:', !!user)
  if (user) {
    try {
      const parsedUser = JSON.parse(user)
      console.log('User data:', parsedUser)
    } catch (e) {
      console.error('Failed to parse user:', e)
    }
  }
  console.groupEnd()
}

// Call this in your components during development