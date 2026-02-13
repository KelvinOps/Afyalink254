//lib/audit.ts


import { prisma } from './prisma'
import { Prisma, AuditAction } from '@prisma/client'

// Re-export AuditAction from Prisma for convenience
export { AuditAction }

// Define proper types for changes
export interface ChangesData {
  [key: string]: unknown
}

export interface AuditLogData {
  action: AuditAction; // Only accept the enum, not arbitrary strings
  entityType: string;
  entityId: string;
  userId: string;
  userRole: string;
  userName?: string;
  description: string;
  changes?: ChangesData;
  ipAddress?: string;
  userAgent?: string;
  facilityId?: string;
  success?: boolean;
  errorMessage?: string;
}

// Define types for request objects (adjust based on your framework)
export interface UserRequest {
  user?: {
    id: string;
    role: string;
    name?: string;
    facilityId?: string;
  };
  method?: string;
  url?: string;
  headers?: {
    'x-forwarded-for'?: string;
    'user-agent'?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
}

// Queue for background audit logging
const auditQueue: AuditLogData[] = []
let isProcessing = false

/**
 * Queue audit log for background processing (non-blocking)
 * This is now the PRIMARY method to use for audit logging
 */
export function queueAuditLog(data: AuditLogData) {
  auditQueue.push(data)
  
  // Process queue in background without blocking
  setImmediate(() => {
    processAuditQueue().catch(err => {
      console.error('Background audit processing error:', err)
    })
  })
}

/**
 * Process queued audit logs in background
 */
async function processAuditQueue() {
  if (isProcessing || auditQueue.length === 0) return
  
  isProcessing = true
  
  try {
    while (auditQueue.length > 0) {
      const item = auditQueue.shift()
      if (item) {
        // Use a timeout to prevent hanging
        await Promise.race([
          auditLogDirect(item),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Audit log timeout')), 5000)
          )
        ]).catch(err => {
          console.error('Background audit log failed (will not retry):', err.message)
          // Don't retry - just log and continue
        })
      }
    }
  } finally {
    isProcessing = false
  }
}

/**
 * Direct audit log creation (use queueAuditLog instead for non-critical paths)
 */
async function auditLogDirect(data: AuditLogData) {
  try {
    // Handle changes field properly for Prisma JSON type
    // Use InputJsonValue for input and DbNull for null values
    let changesData: Prisma.InputJsonValue | Prisma.NullTypes.DbNull = Prisma.DbNull
    if (data.changes) {
      changesData = data.changes as Prisma.InputJsonValue
    }

    // Create the audit log entry with a single attempt
    const auditEntry = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        userName: data.userName || 'System',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        changes: changesData,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        facilityId: data.facilityId || null,
        success: data.success !== undefined ? data.success : true,
        errorMessage: data.errorMessage || null,
        timestamp: new Date(),
      },
    })

    return auditEntry
  } catch (error) {
    // Just log the error, don't throw
    console.error('Audit log creation failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Create an audit log entry (synchronous version for critical operations only)
 * For most cases, use queueAuditLog instead
 */
export async function auditLog(data: AuditLogData) {
  // For critical operations that need immediate logging
  // Use a shorter timeout and single attempt
  try {
    return await Promise.race([
      auditLogDirect(data),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Audit log timeout')), 3000)
      )
    ])
  } catch (error) {
    console.error('Critical audit log failed (queuing for retry):', error)
    // Fall back to queue
    queueAuditLog(data)
    return null
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction; // Only accept the enum
  startDate?: Date;
  endDate?: Date;
  facilityId?: string;
} = {}) {
  const {
    page = 1,
    limit = 50,
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    facilityId,
  } = options

  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {}

  if (userId) where.userId = userId
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (action) {
    where.action = action
  }
  if (facilityId) where.facilityId = facilityId
  
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    throw error
  }
}

/**
 * Search audit logs by description or user name
 */
export async function searchAuditLogs(query: string, options: {
  page?: number;
  limit?: number;
  facilityId?: string;
} = {}) {
  const { page = 1, limit = 50, facilityId } = options
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {
    OR: [
      { description: { contains: query, mode: 'insensitive' } },
      { userName: { contains: query, mode: 'insensitive' } },
      { entityType: { contains: query, mode: 'insensitive' } },
      { userRole: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (facilityId) {
    where.facilityId = facilityId
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error searching audit logs:', error)
    throw error
  }
}

/**
 * Get audit statistics for dashboard
 */
export async function getAuditStatistics(timeframe: '24h' | '7d' | '30d' = '24h', facilityId?: string) {
  const now = new Date()
  const startDate = new Date()

  switch (timeframe) {
    case '24h':
      startDate.setHours(now.getHours() - 24)
      break
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
  }

  const where: Prisma.AuditLogWhereInput = {
    timestamp: {
      gte: startDate,
      lte: now,
    },
  }

  if (facilityId) {
    where.facilityId = facilityId
  }

  try {
    // Get total actions count
    const totalActions = await prisma.auditLog.count({ where })

    // Get actions by type
    const actionsByType = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
    })

    // Get actions by entity type
    const actionsByEntity = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        entityType: true,
      },
    })

    // Get top users by activity
    const topUsers = await prisma.auditLog.groupBy({
      by: ['userId', 'userName'],
      where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    })

    // Get success rate
    const successStats = await prisma.auditLog.groupBy({
      by: ['success'],
      where,
      _count: {
        success: true,
      },
    })

    // Calculate success rate
    const successfulActions = successStats.find(item => item.success === true)?._count?.success || 0
    const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0

    // Get hourly activity for the last 24 hours (FIXED VERSION)
    let hourlyActivity: Array<{ hour: Date; count: bigint }> = []
    if (timeframe === '24h') {
      try {
        // Build the where clause for facility filtering
        const facilityFilter = facilityId 
          ? Prisma.sql`AND "facilityId" = ${facilityId}` 
          : Prisma.empty

        hourlyActivity = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
          SELECT 
            DATE_TRUNC('hour', timestamp) as hour,
            COUNT(*)::int as count
          FROM "audit_log" 
          WHERE timestamp >= ${startDate} 
            AND timestamp <= ${now}
            ${facilityFilter}
          GROUP BY DATE_TRUNC('hour', timestamp)
          ORDER BY hour
        `
      } catch (queryError) {
        console.error('Error fetching hourly activity:', queryError)
        // Fallback: return empty array instead of failing
        hourlyActivity = []
      }
    }

    // Convert hourly activity to proper format
    const formattedHourlyActivity = hourlyActivity.map(item => ({
      hour: item.hour.toISOString(),
      count: Number(item.count), // Convert BigInt to number
    }))

    return {
      timeframe,
      totalActions,
      actionsByType: actionsByType.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      actionsByEntity: actionsByEntity.map(item => ({
        entityType: item.entityType,
        count: item._count.entityType,
      })),
      topUsers: topUsers.map(item => ({
        userId: item.userId,
        userName: item.userName || 'Unknown',
        count: item._count.userId,
      })),
      successRate: Math.round(successRate * 100) / 100,
      hourlyActivity: formattedHourlyActivity,
    }
  } catch (error) {
    console.error('Error getting audit statistics:', error)
    throw error
  }
}

/**
 * Clean up old audit logs (for maintenance)
 */
export async function cleanupAuditLogs(retentionDays: number = 365) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`)
    
    // Log the cleanup action
    queueAuditLog({
      action: AuditAction.DELETE,
      entityType: 'AUDIT_LOG',
      entityId: 'batch-cleanup',
      userId: 'system',
      userRole: 'SYSTEM',
      userName: 'System Maintenance',
      description: `Cleaned up ${result.count} audit logs older than ${retentionDays} days`,
    })

    return result.count
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error)
    
    queueAuditLog({
      action: AuditAction.DELETE,
      entityType: 'AUDIT_LOG',
      entityId: 'batch-cleanup',
      userId: 'system',
      userRole: 'SYSTEM',
      userName: 'System Maintenance',
      description: `Failed to cleanup audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    
    throw error
  }
}

/**
 * Export audit logs to CSV (for compliance and reporting)
 */
export async function exportAuditLogsToCSV(options: {
  startDate?: Date;
  endDate?: Date;
  entityType?: string;
  userId?: string;
  facilityId?: string;
}) {
  const { startDate, endDate, entityType, userId, facilityId } = options

  const where: Prisma.AuditLogWhereInput = {}

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  if (entityType) where.entityType = entityType
  if (userId) where.userId = userId
  if (facilityId) where.facilityId = facilityId

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    })

    // Convert to CSV format
    const headers = ['Timestamp', 'User ID', 'User Role', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Description', 'Success', 'IP Address', 'Facility ID']
    const csvRows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userId,
      log.userRole,
      log.userName || '',
      log.action,
      log.entityType,
      log.entityId,
      `"${log.description.replace(/"/g, '""')}"`,
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      log.facilityId || '',
    ])

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n')

    queueAuditLog({
      action: AuditAction.READ,
      entityType: 'AUDIT_LOG',
      entityId: 'export-csv',
      userId: 'system',
      userRole: 'SYSTEM',
      userName: 'Export System',
      description: `Exported ${logs.length} audit logs to CSV`,
    })

    return csvContent
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    throw error
  }
}

// Convenience functions for common audit actions (ALL USE QUEUE)
export const auditActions = {
  logPatientCreation(patientId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'PATIENT',
      entityId: patientId,
      userId,
      userRole,
      userName,
      description: `Created new patient record`,
      facilityId,
    })
  },

  logPatientUpdate(patientId: string, userId: string, userRole: string, userName: string, changes: ChangesData, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'PATIENT',
      entityId: patientId,
      userId,
      userRole,
      userName,
      description: `Updated patient record`,
      changes,
      facilityId,
    })
  },

  logEmergencyCreation(emergencyId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'EMERGENCY',
      entityId: emergencyId,
      userId,
      userRole,
      userName,
      description: `Created new emergency incident`,
      facilityId,
    })
  },

  logTransferRequest(transferId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'TRANSFER',
      entityId: transferId,
      userId,
      userRole,
      userName,
      description: `Requested patient transfer`,
      facilityId,
    })
  },

  logDispatchCreation(dispatchId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'DISPATCH',
      entityId: dispatchId,
      userId,
      userRole,
      userName,
      description: `Created new emergency dispatch`,
      facilityId,
    })
  },

  logAmbulanceAssignment(dispatchId: string, ambulanceId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'DISPATCH',
      entityId: dispatchId,
      userId,
      userRole,
      userName,
      description: `Assigned ambulance ${ambulanceId} to dispatch`,
      changes: { ambulanceId },
      facilityId,
    })
  },

  logStatusUpdate(entityType: string, entityId: string, oldStatus: string, newStatus: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      userId,
      userRole,
      userName,
      description: `Updated ${entityType.toLowerCase()} status from ${oldStatus} to ${newStatus}`,
      changes: { oldStatus, newStatus },
      facilityId,
    })
  },

  logLogin(userId: string, userRole: string, userName: string, ipAddress?: string, userAgent?: string) {
    queueAuditLog({
      action: AuditAction.LOGIN,
      entityType: 'USER',
      entityId: userId,
      userId,
      userRole,
      userName,
      description: `User logged into the system`,
      ipAddress,
      userAgent,
    })
  },

  logLogout(userId: string, userRole: string, userName: string, ipAddress?: string, userAgent?: string) {
    queueAuditLog({
      action: AuditAction.LOGOUT,
      entityType: 'USER',
      entityId: userId,
      userId,
      userRole,
      userName,
      description: `User logged out from the system`,
      ipAddress,
      userAgent,
    })
  },

  logFailedLogin(userId: string, userRole: string, userName: string, errorMessage: string, ipAddress?: string, userAgent?: string) {
    queueAuditLog({
      action: AuditAction.LOGIN,
      entityType: 'USER',
      entityId: userId,
      userId,
      userRole,
      userName,
      description: `Failed login attempt`,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
    })
  },

  logSHAClaimSubmission(claimId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.SUBMIT_CLAIM,
      entityType: 'SHA_CLAIM',
      entityId: claimId,
      userId,
      userRole,
      userName,
      description: `Submitted SHA claim for processing`,
      facilityId,
    })
  },

  logResourceRequest(resourceId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'RESOURCE_REQUEST',
      entityId: resourceId,
      userId,
      userRole,
      userName,
      description: `Requested new resource`,
      facilityId,
    })
  },

  logStaffCreation(staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'STAFF',
      entityId: staffId,
      userId,
      userRole,
      userName,
      description: `Created new staff member`,
      facilityId,
    })
  },

  logStaffUpdate(staffId: string, userId: string, userRole: string, userName: string, changes: ChangesData, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'STAFF',
      entityId: staffId,
      userId,
      userRole,
      userName,
      description: `Updated staff member information`,
      changes,
      facilityId,
    })
  },

  logStaffDeactivation(staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.DELETE,
      entityType: 'STAFF',
      entityId: staffId,
      userId,
      userRole,
      userName,
      description: `Deactivated staff member`,
      facilityId,
    })
  },

  logScheduleAssignment(scheduleId: string, staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'STAFF_SCHEDULE',
      entityId: scheduleId,
      userId,
      userRole,
      userName,
      description: `Assigned schedule to staff member`,
      facilityId,
    })
  }
}

// Type for middleware handler
export type AuditMiddlewareHandler = (req: UserRequest, ...args: unknown[]) => Promise<unknown>

/**
 * Middleware for automatic audit logging of API requests
 */
export function createAuditMiddleware(
  handler: AuditMiddlewareHandler, 
  options?: {
    entityType?: string;
    action?: AuditAction;
    extractEntityId?: (req: UserRequest) => string;
  }
) {
  return async (req: UserRequest, ...args: unknown[]) => {
    let success = true
    let errorMessage: string | undefined

    try {
      const result = await handler(req, ...args)
      return result
    } catch (error: unknown) {
      success = false
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      const userId = req.user?.id || 'unknown'
      const userRole = req.user?.role || 'unknown'
      const userName = req.user?.name || 'Unknown User'
      const facilityId = req.user?.facilityId
      const entityId = options?.extractEntityId?.(req) || 'unknown'
      const method = req.method || 'GET'
      const url = req.url || 'unknown'
      const ipAddress = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress
      const userAgent = req.headers?.['user-agent']

      // Use queue for middleware
      queueAuditLog({
        action: options?.action || AuditAction.READ,
        entityType: options?.entityType || 'API_REQUEST',
        entityId,
        userId,
        userRole,
        userName,
        description: `API ${method} request to ${url}`,
        ipAddress,
        userAgent,
        facilityId,
        success,
        errorMessage,
      })
    }
  }
}