// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useAuth } from '../../contexts/AuthContext'
import { DashboardStats } from "../../components/dashboard/DashboardStats"
import { QuickActions } from "../../components/dashboard/QuickActions"
import { RecentActivity } from "../../components/dashboard/RecentActivity"
import { AlertsBanner } from "../../components/dashboard/AlertsBanner"
import { TriageQueueWidget } from "../../components/dashboard/TriageQueueWidget"
import { DispatchOverview } from "../../components/dashboard/DispatchOverview"
import { BedCapacityWidget } from "../../components/dashboard/BedCapacityWidget"
import { EmergencyStatus } from "../../components/dashboard/EmergencyStatus"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { 
  Activity, 
  AlertTriangle, 
  Ambulance, 
  Calendar,
  Clock,
  Download,
  Eye,
  FileText,
  Heart,
  Hospital,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, hasPermission, isInitialized } = useAuth()

  // Enhanced statistics data with colors and icons
  const statsData = [
    {
      title: "Total Patients",
      value: "24",
      change: "-12",
      changeType: "decrease",
      icon: Users,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
    },
    {
      title: "Active Patients",
      value: "8",
      change: "-2",
      changeType: "decrease",
      icon: Activity,
      color: "emerald",
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20"
    },
    {
      title: "Avg. Response Time",
      value: "4.2",
      change: "-0.1",
      changeType: "decrease",
      icon: Clock,
      color: "violet",
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
      unit: "min"
    },
    {
      title: "Systolic Uplift",
      value: "99",
      change: "-10",
      changeType: "decrease",
      icon: TrendingUp,
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
      unit: "%"
    }
  ]

  // Show loading if not initialized
  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="glass-card rounded-3xl p-8 shadow-xl border border-white/50 dark:border-slate-800/50 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-950/20">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-4 h-16 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full shadow-lg shadow-blue-500/25"></div>
                <div className="space-y-3">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-cyan-600 dark:from-slate-100 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                      Emergency Dashboard
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-100">{user?.name || user?.email}</span>. 
                      Real-time overview of emergency healthcare operations across the national system.
                    </p>
                  </div>
                  
                  {/* Enhanced Status Bar */}
                  <div className="flex flex-wrap items-center gap-6 pt-4">
                    <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/40"></div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">System Operational</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Last updated: Just now</span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Facility: National System</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced System Status */}
            <div className="mt-6 lg:mt-0 lg:text-right lg:pl-8">
              <div className="inline-flex flex-col items-end gap-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 backdrop-blur-sm">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-bold text-sm tracking-wide">ALL SYSTEMS OPERATIONAL</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    SHA Integration
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Real-time Monitoring
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    24/7 Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Alerts Banner */}
        <AlertsBanner />

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          {/* Enhanced Statistics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => (
              <div 
                key={index}
                className={`relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r ${stat.bgGradient} backdrop-blur-sm`}
              >
                <div className="relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6">
                  {/* Background gradient accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -translate-y-8 translate-x-8`}></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      stat.changeType === 'increase' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                    }`}>
                      {stat.changeType === 'increase' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {stat.value}
                      </span>
                      {stat.unit && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {stat.unit}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {stat.title}
                    </p>
                  </div>

                  {/* Progress bar indicator */}
                  <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full bg-gradient-to-r ${stat.gradient} ${
                        stat.title === "Total Patients" ? 'w-3/4' :
                        stat.title === "Active Patients" ? 'w-1/3' :
                        stat.title === "Avg. Response Time" ? 'w-1/2' :
                        'w-2/3'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Core Operations */}
            <div className="lg:col-span-2 space-y-8">
              {/* Triage Queue */}
              {hasPermission('triage.read') && (
                <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80">
                  <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                    <TriageQueueWidget />
                  </div>
                </div>
              )}

              {/* Dispatch Overview */}
              {hasPermission('dispatch.read') && (
                <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-950/30">
                  <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30">
                    <DispatchOverview />
                  </div>
                </div>
              )}

              {/* Emergency Status */}
              <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-orange-50/50 dark:from-slate-900/80 dark:to-orange-950/20">
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/30">
                  <EmergencyStatus />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80">
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <RecentActivity />
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Resources */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-slate-900/80 dark:to-emerald-950/20">
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/30">
                  <QuickActions />
                </div>
              </div>

              {/* Bed Capacity */}
              {hasPermission('resources.read') && (
                <div className="gradient-border rounded-3xl p-1 bg-gradient-to-r from-white/80 to-purple-50/50 dark:from-slate-900/80 dark:to-purple-950/20">
                  <div className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/30">
                    <BedCapacityWidget />
                  </div>
                </div>
              )}

              {/* Enhanced System Status Card */}
              <Card className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    System Health Monitor
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Real-time system performance and connectivity status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-3">
                    {[
                      { 
                        name: 'Database Cluster', 
                        status: 'Connected', 
                        color: 'green',
                        icon: Shield
                      },
                      { 
                        name: 'Real-time Updates', 
                        status: 'Active', 
                        color: 'green',
                        icon: Zap
                      },
                      { 
                        name: 'SHA Integration', 
                        status: 'Testing', 
                        color: 'yellow',
                        icon: FileText
                      },
                      { 
                        name: 'SMS Gateway', 
                        status: 'Online', 
                        color: 'green',
                        icon: MessageSquare
                      }
                    ].map((service, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            service.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                            service.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <service.icon className={`w-4 h-4 ${
                              service.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              service.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{service.name}</span>
                        </div>
                        <Badge variant="secondary" className={`
                          ${service.color === 'green' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300' :
                            service.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300'
                          } font-medium
                        `}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Performance Metrics */}
                  <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div className="space-y-2">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                          99.8%
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          System Uptime
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                          45ms
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Avg Response
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Emergency Contacts */}
              <Card className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-950/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    Emergency Contacts
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Critical contact information for immediate assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  {[
                    {
                      title: 'Emergency Dispatch',
                      number: '+254-722-363744',
                      color: 'red',
                      icon: Ambulance
                    },
                    {
                      title: 'Medical Director',
                      number: '+254-722-633347',
                      color: 'blue',
                      icon: Hospital
                    },
                    {
                      title: 'IT Support',
                      number: '+254-722-484357',
                      color: 'green',
                      icon: Shield
                    }
                  ].map((contact, index) => (
                    <button
                      key={index}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                        contact.color === 'red' 
                          ? 'border-red-200 bg-red-50/50 hover:bg-red-100/70 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-900/30' 
                          : contact.color === 'blue'
                          ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-900/30'
                          : 'border-green-200 bg-green-50/50 hover:bg-green-100/70 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-900/30'
                      } backdrop-blur-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          contact.color === 'red' 
                            ? 'bg-red-100 dark:bg-red-900/40' 
                            : contact.color === 'blue'
                            ? 'bg-blue-100 dark:bg-blue-900/40'
                            : 'bg-green-100 dark:bg-green-900/40'
                        }`}>
                          <contact.icon className={`w-4 h-4 ${
                            contact.color === 'red' 
                              ? 'text-red-600 dark:text-red-400' 
                              : contact.color === 'blue'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            contact.color === 'red' 
                              ? 'text-red-700 dark:text-red-300' 
                              : contact.color === 'blue'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {contact.title}
                          </div>
                          <div className={`text-sm font-mono ${
                            contact.color === 'red' 
                              ? 'text-red-600 dark:text-red-400' 
                              : contact.color === 'blue'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {contact.number}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}