// src/contexts/NotificationContext.tsx
'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'emergency'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  priority?: 'low' | 'medium' | 'high' | 'critical'
  source?: string // e.g., 'triage', 'dispatch', 'sha-claims'
  acknowledged?: boolean
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  soundEnabled: boolean
  emergencyMode: boolean
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'ACKNOWLEDGE_NOTIFICATION'; payload: string }
  | { type: 'ACKNOWLEDGE_ALL' }
  | { type: 'CLEAR_ALL' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SET_EMERGENCY_MODE'; payload: boolean }
  | { type: 'MARK_ALL_READ' }

interface NotificationContextType {
  state: NotificationState
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  acknowledgeNotification: (id: string) => void
  acknowledgeAll: () => void
  clearAll: () => void
  toggleSound: () => void
  setEmergencyMode: (enabled: boolean) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,
  emergencyMode: false
}

// Reducer function
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification = {
        ...action.payload,
        timestamp: new Date()
      }
      
      // Calculate unread count
      const newUnreadCount = state.unreadCount + 1
      
      // Play sound if enabled and not in emergency mode (to avoid sound overload)
      if (state.soundEnabled && !state.emergencyMode) {
        playNotificationSound(action.payload.type)
      }
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        unreadCount: newUnreadCount
      }

    case 'REMOVE_NOTIFICATION':
      const removedNotification = state.notifications.find(n => n.id === action.payload)
      const removedUnreadCount = removedNotification && !removedNotification.acknowledged 
        ? state.unreadCount - 1 
        : state.unreadCount
      
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: Math.max(0, removedUnreadCount)
      }

    case 'ACKNOWLEDGE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, acknowledged: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }

    case 'ACKNOWLEDGE_ALL':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, acknowledged: true })),
        unreadCount: 0
      }

    case 'MARK_ALL_READ':
      return {
        ...state,
        unreadCount: 0
      }

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      }

    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled
      }

    case 'SET_EMERGENCY_MODE':
      return {
        ...state,
        emergencyMode: action.payload
      }

    default:
      return state
  }
}

// Helper function to play notification sounds
function playNotificationSound(type: NotificationType) {
  // In a real app, you would play actual sound files
  // For now, we'll use the Web Audio API to generate simple tones
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      console.warn('AudioContext not supported')
      return
    }
    
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Different frequencies for different notification types
    const frequencies: Record<NotificationType, number> = {
      info: 800,
      success: 1000,
      warning: 1200,
      error: 600,
      emergency: 300
    }

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.warn('Audio context not supported:', error)
  }
}

// Notification Provider Component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)

const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  const id = Math.random().toString(36).substr(2, 9)
  const timestamp = new Date() // Add the missing timestamp
  
  dispatch({ 
    type: 'ADD_NOTIFICATION', 
    payload: { 
      ...notification, 
      id, 
      timestamp // Include the timestamp
    } 
  })
  
  // Auto-remove after duration (default: 5 seconds for non-critical, 10 seconds for critical)
  const duration = notification.duration || (notification.priority === 'critical' ? 10000 : 5000)
  setTimeout(() => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, duration)
}

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const acknowledgeNotification = (id: string) => {
    dispatch({ type: 'ACKNOWLEDGE_NOTIFICATION', payload: id })
  }

  const acknowledgeAll = () => {
    dispatch({ type: 'ACKNOWLEDGE_ALL' })
  }

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' })
  }

  const toggleSound = () => {
    dispatch({ type: 'TOGGLE_SOUND' })
  }

  const setEmergencyMode = (enabled: boolean) => {
    dispatch({ type: 'SET_EMERGENCY_MODE', payload: enabled })
  }

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_READ' })
  }

  // Emergency mode auto-enable during peak hours (8 AM - 8 PM)
  useEffect(() => {
    const checkEmergencyMode = () => {
      const hour = new Date().getHours()
      const isEmergencyHours = hour >= 8 && hour <= 20
      setEmergencyMode(isEmergencyHours)
    }

    checkEmergencyMode()
    const interval = setInterval(checkEmergencyMode, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Auto-add demo notifications in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && state.notifications.length === 0) {
      // Add a sample emergency notification
      setTimeout(() => {
        addNotification({
          type: 'emergency',
          title: 'Mass Casualty Incident',
          message: 'Multiple casualties reported at City Mall. Emergency response activated.',
          priority: 'critical',
          source: 'dispatch',
          duration: 8000
        })
      }, 2000)

      // Add a sample triage notification
      setTimeout(() => {
        addNotification({
          type: 'warning',
          title: 'Triage Queue Critical',
          message: 'High priority patients waiting exceeds capacity threshold.',
          priority: 'high',
          source: 'triage',
          duration: 6000
        })
      }, 4000)
    }
  }, [state.notifications.length])

  const value: NotificationContextType = {
    state,
    addNotification,
    removeNotification,
    acknowledgeNotification,
    acknowledgeAll,
    clearAll,
    toggleSound,
    setEmergencyMode,
    markAllAsRead
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  )
}

// Notification Toast Component
function NotificationToasts() {
  const { state, removeNotification, acknowledgeNotification } = useNotification()

  if (state.notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {state.notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onAcknowledge={() => acknowledgeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Individual Notification Toast Component
function NotificationToast({ 
  notification, 
  onClose, 
  onAcknowledge 
}: { 
  notification: Notification
  onClose: () => void
  onAcknowledge: () => void
}) {
  const iconConfig = {
    info: { icon: Info, className: 'bg-blue-100 text-blue-600' },
    success: { icon: CheckCircle, className: 'bg-green-100 text-green-600' },
    warning: { icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-600' },
    error: { icon: XCircle, className: 'bg-red-100 text-red-600' },
    emergency: { icon: AlertTriangle, className: 'bg-red-100 text-red-600 animate-pulse' }
  }

  const { icon: Icon, className } = iconConfig[notification.type]

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-2xl border p-4 animate-in slide-in-from-right duration-300',
        'transform transition-all hover:scale-105',
        notification.priority === 'critical' && 'border-2 border-red-300 shadow-glow-red',
        notification.priority === 'high' && 'border-2 border-orange-300'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', className)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </p>
                {notification.source && (
                  <Badge variant="outline" className="text-xs">
                    {notification.source}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notification.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  notification.action?.onClick()
                  onAcknowledge()
                }}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Custom hook to use the notification context
export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Helper component types
interface BadgeProps {
  variant?: 'default' | 'outline'
  className?: string
  children: React.ReactNode
}

interface ButtonProps {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

// Helper components (you might need to create these or use from your UI library)
const Badge = ({ variant = 'default', className, children }: BadgeProps) => (
  <span className={cn(
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    variant === 'outline' && 'border border-gray-300 text-gray-700',
    className
  )}>
    {children}
  </span>
)

const Button = ({ variant = 'default', size = 'default', className, onClick, children }: ButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      variant === 'outline' && 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700',
      size === 'sm' && 'h-8 px-3 text-xs',
      className
    )}
  >
    {children}
  </button>
)