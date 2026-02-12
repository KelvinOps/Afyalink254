// src/app/(dashboard)/dispatch/calls/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useNotification } from '@/app/contexts/NotificationContext'

interface DispatchCall {
  id: string
  dispatchNumber: string
  callerPhone: string
  callerName: string
  callerLocation: string
  emergencyType: string
  severity: string
  description: string
  patientCount: number
  status: string
  callReceived: string
  ambulance?: {
    registrationNumber: string
  }
  countyAmbulance?: {
    registrationNumber: string
  }
}

export default function DispatchCallsPage() {
  const { user, hasPermission } = useAuth()
  const { addNotification } = useNotification()
  const [activeCalls, setActiveCalls] = useState<DispatchCall[]>([])
  const [historicalLogs, setHistoricalLogs] = useState<DispatchCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'historical'>('active')
  const [isCreating, setIsCreating] = useState(false)

  // New call form state
  const [newCall, setNewCall] = useState({
    callerPhone: '',
    callerName: '',
    location: '',
    emergencyType: 'MEDICAL',
    severity: 'URGENT',
    description: '',
    patientCount: 1
  })

  // Memoize fetchDispatchData with useCallback
  const fetchDispatchData = useCallback(async () => {
    try {
      const params = viewMode === 'historical' 
        ? '?logs=true&limit=50' 
        : ''
      
      const response = await fetch(`/api/dispatch${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dispatch data')
      }

      const data = await response.json()
      
      if (viewMode === 'historical') {
        setHistoricalLogs(data.logs || [])
      } else {
        setActiveCalls(data.calls || [])
      }
    } catch (error) {
      console.error('Error fetching dispatch data:', error)
      addNotification({
        type: 'error',
        title: 'Data Load Failed',
        message: 'Failed to load dispatch data. Please try again.',
        priority: 'medium',
        source: 'dispatch',
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [viewMode, addNotification])

  useEffect(() => {
    fetchDispatchData()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchDispatchData, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchDispatchData])

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasPermission('dispatch.write')) {
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to create dispatch calls',
        priority: 'high',
        source: 'dispatch',
        duration: 6000
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(newCall)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create dispatch call')
      }

      const result = await response.json()
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Dispatch Created',
        message: `Successfully created dispatch call ${result.dispatchLog.dispatchNumber}`,
        priority: 'medium',
        source: 'dispatch',
        duration: 5000,
        action: {
          label: 'View Details',
          onClick: () => {
            // You could navigate to the dispatch details page here
            console.log('Navigate to dispatch details:', result.dispatchLog.id)
          }
        }
      })
      
      // Reset form
      setNewCall({
        callerPhone: '',
        callerName: '',
        location: '',
        emergencyType: 'MEDICAL',
        severity: 'URGENT',
        description: '',
        patientCount: 1
      })
      
      // Refresh data
      fetchDispatchData()

      // If it's a critical emergency, show emergency notification
      if (newCall.severity === 'CRITICAL') {
        addNotification({
          type: 'emergency',
          title: 'Critical Emergency Dispatch',
          message: `Critical ${newCall.emergencyType.toLowerCase()} emergency at ${newCall.location}. Immediate response required.`,
          priority: 'critical',
          source: 'dispatch',
          duration: 10000
        })
      }

    } catch (error) {
      console.error('Error creating dispatch call:', error)
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to create dispatch call',
        priority: 'high',
        source: 'dispatch',
        duration: 6000
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updateCallStatus = async (callId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dispatch/${callId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update call status')
      }

      const result = await response.json()
      
      // Show status update notification
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Dispatch ${result.dispatch.dispatchNumber} status updated to ${newStatus.replace('_', ' ')}`,
        priority: 'low',
        source: 'dispatch',
        duration: 4000
      })

      // Special notifications for critical status changes
      if (newStatus === 'ON_SCENE') {
        addNotification({
          type: 'info',
          title: 'Ambulance On Scene',
          message: `Ambulance has arrived at the emergency location for ${result.dispatch.dispatchNumber}`,
          priority: 'medium',
          source: 'dispatch',
          duration: 5000
        })
      } else if (newStatus === 'TRANSPORTING') {
        addNotification({
          type: 'warning',
          title: 'Patient Transport Started',
          message: `Patient is now being transported to hospital for ${result.dispatch.dispatchNumber}`,
          priority: 'medium',
          source: 'dispatch',
          duration: 5000
        })
      } else if (newStatus === 'COMPLETED') {
        addNotification({
          type: 'success',
          title: 'Dispatch Completed',
          message: `Emergency response completed for ${result.dispatch.dispatchNumber}`,
          priority: 'low',
          source: 'dispatch',
          duration: 4000
        })
      }

      fetchDispatchData()
    } catch (error) {
      console.error('Error updating call status:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update call status. Please try again.',
        priority: 'high',
        source: 'dispatch',
        duration: 5000
      })
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'RECEIVED': 'bg-blue-100 text-blue-800',
      'DISPATCHED': 'bg-yellow-100 text-yellow-800',
      'ON_SCENE': 'bg-orange-100 text-orange-800',
      'TRANSPORTING': 'bg-purple-100 text-purple-800',
      'AT_HOSPITAL': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
      'URGENT': 'bg-orange-100 text-orange-800 border-orange-200',
      'NON_URGENT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ROUTINE': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleViewModeChange = (mode: 'active' | 'historical') => {
    setViewMode(mode)
    addNotification({
      type: 'info',
      title: 'View Changed',
      message: `Now viewing ${mode === 'active' ? 'active emergency calls' : 'historical dispatch logs'}`,
      priority: 'low',
      source: 'dispatch',
      duration: 3000
    })
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    fetchDispatchData()
    addNotification({
      type: 'info',
      title: 'Refreshing Data',
      message: 'Updating dispatch information...',
      priority: 'low',
      source: 'dispatch',
      duration: 2000
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access dispatch calls.</p>
        </div>
      </div>
    )
  }

  if (!hasPermission('dispatch.read')) {
    addNotification({
      type: 'error',
      title: 'Access Denied',
      message: 'You do not have permission to view dispatch calls',
      priority: 'high',
      source: 'dispatch',
      duration: 6000
    })
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Permission Denied</h2>
          <p className="text-gray-600">You don't have permission to view dispatch calls.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Dispatch Calls</h1>
              <p className="text-gray-600">Manage and monitor emergency calls and ambulance dispatch</p>
            </div>
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => handleViewModeChange('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Active Calls ({activeCalls.length})
            </button>
            <button
              onClick={() => handleViewModeChange('historical')}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === 'historical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Historical Logs
            </button>
          </div>
        </div>

        {/* Create New Call Form */}
        {hasPermission('dispatch.write') && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Dispatch Call</h2>
            <form onSubmit={handleCreateCall} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caller Phone *</label>
                <input
                  type="tel"
                  required
                  value={newCall.callerPhone}
                  onChange={(e) => setNewCall({ ...newCall, callerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0712345678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caller Name *</label>
                <input
                  type="text"
                  required
                  value={newCall.callerName}
                  onChange={(e) => setNewCall({ ...newCall, callerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={newCall.location}
                  onChange={(e) => setNewCall({ ...newCall, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type *</label>
                <select
                  value={newCall.emergencyType}
                  onChange={(e) => setNewCall({ ...newCall, emergencyType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MEDICAL">Medical</option>
                  <option value="TRAUMA">Trauma</option>
                  <option value="CARDIAC">Cardiac</option>
                  <option value="RESPIRATORY">Respiratory</option>
                  <option value="OBSTETRIC">Obstetric</option>
                  <option value="PEDIATRIC">Pediatric</option>
                  <option value="TRAFFIC_ACCIDENT">Traffic Accident</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select
                  value={newCall.severity}
                  onChange={(e) => setNewCall({ ...newCall, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="URGENT">Urgent</option>
                  <option value="NON_URGENT">Non-Urgent</option>
                  <option value="ROUTINE">Routine</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Count</label>
                <input
                  type="number"
                  min="1"
                  value={newCall.patientCount}
                  onChange={(e) => setNewCall({ ...newCall, patientCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCall.description}
                  onChange={(e) => setNewCall({ ...newCall, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the emergency situation..."
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Dispatch Call'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calls List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'active' ? 'Active Emergency Calls' : 'Historical Dispatch Logs'}
            </h2>
            {viewMode === 'active' && activeCalls.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {activeCalls.filter(call => call.severity === 'CRITICAL').length} critical emergencies
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading dispatch data...</p>
            </div>
          ) : viewMode === 'active' && activeCalls.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No active emergency calls at the moment.</p>
            </div>
          ) : viewMode === 'historical' && historicalLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No historical dispatch logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emergency Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ambulance
                    </th>
                    {viewMode === 'active' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(viewMode === 'active' ? activeCalls : historicalLogs).map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.dispatchNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {call.callerName} • {call.callerPhone}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {call.callerLocation}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(call.callReceived).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.emergencyType.replace('_', ' ')}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(call.severity)}`}>
                          {call.severity}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {call.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Patients: {call.patientCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                          {call.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.ambulance?.registrationNumber || call.countyAmbulance?.registrationNumber || 'Not assigned'}
                      </td>
                      {viewMode === 'active' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {call.status === 'RECEIVED' && (
                              <button
                                onClick={() => updateCallStatus(call.id, 'DISPATCHED')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Dispatch
                              </button>
                            )}
                            {call.status === 'DISPATCHED' && (
                              <button
                                onClick={() => updateCallStatus(call.id, 'ON_SCENE')}
                                className="text-green-600 hover:text-green-900"
                              >
                                On Scene
                              </button>
                            )}
                            {call.status === 'ON_SCENE' && (
                              <button
                                onClick={() => updateCallStatus(call.id, 'TRANSPORTING')}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Transporting
                              </button>
                            )}
                            {call.status === 'TRANSPORTING' && (
                              <button
                                onClick={() => updateCallStatus(call.id, 'AT_HOSPITAL')}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                At Hospital
                              </button>
                            )}
                            {call.status === 'AT_HOSPITAL' && (
                              <button
                                onClick={() => updateCallStatus(call.id, 'COMPLETED')}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}