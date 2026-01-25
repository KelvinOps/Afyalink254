//app/lib/audit.ts

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Use the complete enum from your Prisma schema
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ', 
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  TRANSFER = 'TRANSFER',
  DISCHARGE = 'DISCHARGE',
  PRESCRIBE = 'PRESCRIBE',
  SUBMIT_CLAIM = 'SUBMIT_CLAIM',
  CANCEL = 'CANCEL',
  OVERRIDE = 'OVERRIDE'
}

export interface AuditLogData {
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  userId: string;
  userRole: string;
  userName?: string;
  description: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  facilityId?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Create an audit log entry for tracking critical actions in the system
 */
export async function auditLog(data: AuditLogData) {
  try {
    // Handle changes field properly for Prisma JSON type
    let changesData: any = Prisma.DbNull
    if (data.changes) {
      changesData = data.changes
    }

    // Create the audit log entry
    const auditEntry = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        userName: data.userName || 'System',
        action: data.action as any,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        changes: changesData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        facilityId: data.facilityId,
        success: data.success !== undefined ? data.success : true,
        errorMessage: data.errorMessage,
        timestamp: new Date(),
      },
    })

    return auditEntry
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw to avoid breaking main functionality
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
  action?: AuditAction | string;
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
    // FIXED: Cast the action to the proper Prisma enum type
    where.action = action as Prisma.EnumAuditActionFilter<"AuditLog">
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
  let startDate = new Date()

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

    // Get hourly activity for the last 24 hours - FIXED: Added proper type annotation
    let hourlyActivity: Array<{ hour: string; count: number }> = []
    if (timeframe === '24h') {
      // FIXED: Use proper SQL template and handle the facilityId condition correctly
      const hourlyData = await prisma.$queryRaw<Array<{ hour: string; count: number }>>`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as count
        FROM "audit_logs" 
        WHERE timestamp >= ${startDate} AND timestamp <= ${now}
        ${facilityId ? Prisma.sql`AND "facilityId" = ${facilityId}` : Prisma.empty}
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour
      `
      hourlyActivity = hourlyData
    }

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
        userName: item.userName,
        count: item._count.userId,
      })),
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      hourlyActivity,
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
    await auditLog({
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
    
    // Log the failure
    await auditLog({
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
      log.userName,
      log.action,
      log.entityType,
      log.entityId,
      `"${log.description.replace(/"/g, '""')}"`, // Escape quotes in description
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      log.facilityId || '',
    ])

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n')

    // Log the export action
    await auditLog({
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

// Convenience functions for common audit actions
export const auditActions = {
  async logPatientCreation(patientId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logPatientUpdate(patientId: string, userId: string, userRole: string, userName: string, changes: any, facilityId?: string) {
    return auditLog({
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

  async logEmergencyCreation(emergencyId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logTransferRequest(transferId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logDispatchCreation(dispatchId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logAmbulanceAssignment(dispatchId: string, ambulanceId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logStatusUpdate(entityType: string, entityId: string, oldStatus: string, newStatus: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logLogin(userId: string, userRole: string, userName: string, ipAddress?: string, userAgent?: string) {
    return auditLog({
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

  async logFailedLogin(userId: string, userRole: string, userName: string, errorMessage: string, ipAddress?: string, userAgent?: string) {
    return auditLog({
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

  async logSHAClaimSubmission(claimId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logResourceRequest(resourceId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

   async logStaffCreation(staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logStaffUpdate(staffId: string, userId: string, userRole: string, userName: string, changes: any, facilityId?: string) {
    return auditLog({
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

  async logStaffDeactivation(staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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

  async logScheduleAssignment(scheduleId: string, staffId: string, userId: string, userRole: string, userName: string, facilityId?: string) {
    return auditLog({
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





/**
 * Middleware for automatic audit logging of API requests
 */
export function createAuditMiddleware(handler: Function, options?: {
  entityType?: string;
  action?: AuditAction;
  extractEntityId?: (req: any) => string;
}) {
  return async (req: any, ...args: any[]) => {
    const startTime = Date.now()
    let success = true
    let errorMessage: string | undefined

    try {
      const result = await handler(req, ...args)
      return result
    } catch (error) {
      success = false
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      // Extract user info from request (adjust based on your auth system)
      const userId = req.user?.id || 'unknown'
      const userRole = req.user?.role || 'unknown'
      const userName = req.user?.name || 'Unknown User'
      const facilityId = req.user?.facilityId

      // Extract entity ID if provided
      const entityId = options?.extractEntityId?.(req) || 'unknown'

      // Auto-log the action
      await auditLog({
        action: options?.action || AuditAction.READ,
        entityType: options?.entityType || 'API_REQUEST',
        entityId,
        userId,
        userRole,
        userName,
        description: `API ${req.method} request to ${req.url}`,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        facilityId,
        success,
        errorMessage,
      })
    }
  }
}