// src/contexts/WebSocketContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useRef, useReducer } from 'react'
import { useNotification } from './NotificationContext'

// WebSocket message types
export type WebSocketMessageType = 
  | 'TRIAGE_UPDATE'
  | 'DISPATCH_ALERT'
  | 'AMBULANCE_STATUS'
  | 'BED_CAPACITY'
  | 'EMERGENCY_ALERT'
  | 'SYSTEM_STATUS'
  | 'SHA_CLAIM_UPDATE'
  | 'PATIENT_TRANSFER'
  | 'RESOURCE_ALERT'

export interface WebSocketMessage {
  type: WebSocketMessageType
  data: any
  timestamp: string
  facilityId?: string
  countyId?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  lastMessage: WebSocketMessage | null
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  reconnectAttempts: number
  subscriptions: Set<string>
}

type WebSocketAction =
  | { type: 'CONNECTION_START' }
  | { type: 'CONNECTION_SUCCESS' }
  | { type: 'CONNECTION_ERROR' }
  | { type: 'CONNECTION_CLOSED' }
  | { type: 'MESSAGE_RECEIVED'; payload: WebSocketMessage }
  | { type: 'INCREMENT_RECONNECT_ATTEMPTS' }
  | { type: 'RESET_RECONNECT_ATTEMPTS' }
  | { type: 'ADD_SUBSCRIPTION'; payload: string }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }

interface WebSocketContextType {
  state: WebSocketState
  sendMessage: (message: WebSocketMessage) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  reconnect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

// Initial state
const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  lastMessage: null,
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  subscriptions: new Set(['emergency-alerts', 'system-status'])
}

// Reducer function
function webSocketReducer(state: WebSocketState, action: WebSocketAction): WebSocketState {
  switch (action.type) {
    case 'CONNECTION_START':
      return {
        ...state,
        isConnecting: true,
        connectionStatus: 'connecting'
      }

    case 'CONNECTION_SUCCESS':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        connectionStatus: 'connected',
        reconnectAttempts: 0
      }

    case 'CONNECTION_ERROR':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectionStatus: 'error'
      }

    case 'CONNECTION_CLOSED':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectionStatus: 'disconnected'
      }

    case 'MESSAGE_RECEIVED':
      return {
        ...state,
        lastMessage: action.payload
      }

    case 'INCREMENT_RECONNECT_ATTEMPTS':
      return {
        ...state,
        reconnectAttempts: state.reconnectAttempts + 1
      }

    case 'RESET_RECONNECT_ATTEMPTS':
      return {
        ...state,
        reconnectAttempts: 0
      }

    case 'ADD_SUBSCRIPTION':
      const newSubscriptions = new Set(state.subscriptions)
      newSubscriptions.add(action.payload)
      return {
        ...state,
        subscriptions: newSubscriptions
      }

    case 'REMOVE_SUBSCRIPTION':
      const filteredSubscriptions = new Set(state.subscriptions)
      filteredSubscriptions.delete(action.payload)
      return {
        ...state,
        subscriptions: filteredSubscriptions
      }

    default:
      return state
  }
}

// WebSocket Provider Component
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(webSocketReducer, initialState)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Use useNotification with error handling since it might not be available
  let addNotification: any = () => {};
  try {
    const notificationContext = useNotification();
    addNotification = notificationContext.addNotification;
  } catch (error) {
    console.warn('NotificationContext not available, notifications disabled');
  }

  // WebSocket URL - in production, this would be from environment variables
  const getWebSocketUrl = () => {
    // Use environment variable if available, otherwise fallback
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    
    if (typeof window !== 'undefined') {
      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // For development, try local WebSocket server
        return 'ws://localhost:3001/ws';
      } else {
        // For production, use secure WebSocket and current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws`;
      }
    }
    
    // Default fallback
    return 'ws://localhost:3001/ws';
  }

  const connect = () => {
    // Prevent multiple connection attempts
    if (state.isConnected || state.isConnecting || (ws.current && ws.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already in progress, skipping...');
      return;
    }

    try {
      dispatch({ type: 'CONNECTION_START' });
      
      const wsUrl = getWebSocketUrl();
      console.log('🔄 Connecting to WebSocket:', wsUrl);
      
      // Validate URL format
      if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        console.error('Invalid WebSocket URL format:', wsUrl);
        dispatch({ type: 'CONNECTION_ERROR' });
        return;
      }

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        dispatch({ type: 'CONNECTION_SUCCESS' });
        dispatch({ type: 'RESET_RECONNECT_ATTEMPTS' });
        
        // Resubscribe to all channels
        state.subscriptions.forEach(channel => {
          subscribe(channel);
        });

        // Notify connection established
        try {
          addNotification({
            type: 'success',
            title: 'Real-time Connection Established',
            message: 'Live updates are now active',
            priority: 'low',
            source: 'system',
            duration: 3000
          });
        } catch (error) {
          console.log('Notification not available for connection success');
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          dispatch({ type: 'MESSAGE_RECEIVED', payload: message });
          handleIncomingMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, event.data);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        dispatch({ type: 'CONNECTION_CLOSED' });
        
        // Attempt reconnection unless closed normally
        if (event.code !== 1000) {
          console.log('🔄 Scheduling reconnect due to abnormal closure');
          scheduleReconnect();
        } else {
          console.log('✅ WebSocket closed normally, no reconnect scheduled');
        }
      };

      ws.current.onerror = (error: Event) => {
        console.error('❌ WebSocket error event:', error);
        // The actual error details might be limited due to browser security
        dispatch({ type: 'CONNECTION_ERROR' });
        
        // Show more specific error notification
        try {
          addNotification({
            type: 'error',
            title: 'Connection Error',
            message: 'Failed to connect to real-time updates',
            priority: 'medium',
            source: 'system',
            duration: 5000
          });
        } catch (notifError) {
          console.log('Notification not available for connection error');
        }
      };

    } catch (error) {
      console.error('💥 Failed to create WebSocket connection:', error);
      dispatch({ type: 'CONNECTION_ERROR' });
      scheduleReconnect();
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting WebSocket...');
    
    // Clear any pending reconnect attempts
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    // Close WebSocket connection if it exists
    if (ws.current) {
      // Remove event listeners to prevent memory leaks
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      
      // Only close if not already closed or closing
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close(1000, 'Manual disconnect');
      }
      ws.current = null;
    }

    dispatch({ type: 'CONNECTION_CLOSED' });
  };

  const scheduleReconnect = () => {
    if (reconnectTimeout.current) {
      console.log('⏰ Reconnect already scheduled, skipping...');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`⏰ Scheduling reconnect in ${delay}ms (attempt ${state.reconnectAttempts + 1})`);
    
    reconnectTimeout.current = setTimeout(() => {
      console.log('🔄 Attempting reconnect...');
      reconnectTimeout.current = null;
      dispatch({ type: 'INCREMENT_RECONNECT_ATTEMPTS' });
      connect();
    }, delay);
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message);
      try {
        addNotification({
          type: 'warning',
          title: 'Connection Issue',
          message: 'Real-time updates temporarily unavailable',
          priority: 'medium',
          source: 'system',
          duration: 5000
        });
      } catch (notifError) {
        console.log('Notification not available for connection warning');
      }
    }
  };

  const subscribe = (channel: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'SYSTEM_STATUS',
        data: { action: 'subscribe', channel },
        timestamp: new Date().toISOString()
      });
    }
    dispatch({ type: 'ADD_SUBSCRIPTION', payload: channel });
  };

  const unsubscribe = (channel: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'SYSTEM_STATUS',
        data: { action: 'unsubscribe', channel },
        timestamp: new Date().toISOString()
      });
    }
    dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: channel });
  };

  const reconnect = () => {
    console.log('🔄 Manual reconnect triggered');
    disconnect();
    // Small delay before reconnecting to allow cleanup
    setTimeout(connect, 500);
  };

  const handleIncomingMessage = (message: WebSocketMessage) => {
    console.log('📨 Handling incoming message:', message.type);
    
    try {
      // Handle different message types and show appropriate notifications
      switch (message.type) {
        case 'EMERGENCY_ALERT':
          addNotification({
            type: 'emergency',
            title: message.data.title || 'Emergency Alert',
            message: message.data.message,
            priority: 'critical',
            source: 'dispatch',
            duration: 10000,
            action: message.data.actionUrl ? {
              label: 'View Details',
              onClick: () => window.open(message.data.actionUrl, '_blank')
            } : undefined
          });
          break;

        case 'TRIAGE_UPDATE':
          if (message.data.priority === 'high' || message.data.priority === 'critical') {
            addNotification({
              type: 'warning',
              title: 'Triage Update',
              message: message.data.message,
              priority: message.data.priority,
              source: 'triage',
              duration: 6000
            });
          }
          break;

        case 'DISPATCH_ALERT':
          addNotification({
            type: message.data.severity === 'critical' ? 'error' : 'warning',
            title: 'Dispatch Alert',
            message: message.data.message,
            priority: message.data.severity === 'critical' ? 'critical' : 'high',
            source: 'dispatch',
            duration: 8000
          });
          break;

        case 'AMBULANCE_STATUS':
          if (message.data.status === 'emergency') {
            addNotification({
              type: 'emergency',
              title: 'Ambulance Emergency',
              message: message.data.message,
              priority: 'critical',
              source: 'dispatch',
              duration: 10000
            });
          }
          break;

        case 'RESOURCE_ALERT':
          addNotification({
            type: 'warning',
            title: 'Resource Alert',
            message: message.data.message,
            priority: message.data.critical ? 'high' : 'medium',
            source: 'resources',
            duration: 5000
          });
          break;

        case 'SYSTEM_STATUS':
          if (message.data.status === 'degraded' || message.data.status === 'down') {
            addNotification({
              type: 'error',
              title: 'System Status Update',
              message: message.data.message,
              priority: 'high',
              source: 'system',
              duration: 8000
            });
          }
          break;

        default:
          console.log('ℹ️ Unhandled WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  };

  // Auto-connect on component mount
  useEffect(() => {
    console.log('🚀 WebSocketProvider mounted, attempting connection...');
    
    // Only connect if we're in the browser
    if (typeof window !== 'undefined') {
      connect();
    }

    return () => {
      console.log('🧹 WebSocketProvider unmounting, cleaning up...');
      disconnect();
    };
  }, []);

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (!state.isConnected && 
        !state.isConnecting && 
        state.connectionStatus === 'error' &&
        state.reconnectAttempts < 5) { // Limit reconnection attempts
      console.log('🔄 Auto-reconnect triggered');
      scheduleReconnect();
    }
  }, [state.isConnected, state.isConnecting, state.connectionStatus, state.reconnectAttempts]);

  const value: WebSocketContextType = {
    state,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
      <WebSocketStatusIndicator />
    </WebSocketContext.Provider>
  );
}

// WebSocket Status Indicator Component
function WebSocketStatusIndicator() {
  const { state, reconnect } = useWebSocket();

  // Don't show indicator when connected
  if (state.connectionStatus === 'connected') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium
        ${state.connectionStatus === 'connecting' || state.connectionStatus === 'reconnecting' 
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
          : state.connectionStatus === 'error' 
          ? 'bg-red-100 text-red-800 border border-red-300' 
          : 'bg-gray-100 text-gray-800 border border-gray-300'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full animate-pulse
          ${state.connectionStatus === 'connecting' || state.connectionStatus === 'reconnecting' 
            ? 'bg-yellow-500' 
            : state.connectionStatus === 'error' 
            ? 'bg-red-500' 
            : 'bg-gray-500'
          }
        `} />
        
        <span>
          {state.connectionStatus === 'connecting' && 'Connecting...'}
          {state.connectionStatus === 'reconnecting' && 'Reconnecting...'}
          {state.connectionStatus === 'error' && 'Connection Lost'}
          {state.connectionStatus === 'disconnected' && 'Disconnected'}
        </span>

        {(state.connectionStatus === 'error' || state.connectionStatus === 'disconnected') && (
          <button
            onClick={reconnect}
            className="ml-2 text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Custom hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Helper hook for specific message types
export function useWebSocketMessage<T>(type: WebSocketMessageType, callback: (data: T) => void) {
  const { state } = useWebSocket();

  useEffect(() => {
    if (state.lastMessage && state.lastMessage.type === type) {
      callback(state.lastMessage.data as T);
    }
  }, [state.lastMessage, type, callback]);
}