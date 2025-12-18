export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  COUNTY_ADMIN: [
    'dashboard.read', 'triage.read', 'patients.read', 'transfers.read', 'transfers.write',
    'dispatch.read', 'referrals.read', 'resources.read', 'procurement.read', 'procurement.write',
    'claims.read', 'telemedicine.read', 'emergencies.read', 'emergencies.write',
    'analytics.read', 'staff.read', 'hospitals.read', 'settings.read'
  ],
  HOSPITAL_ADMIN: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'transfers.read', 'transfers.write', 'dispatch.read', 'referrals.read', 'referrals.write',
    'resources.read', 'resources.write', 'procurement.read', 'procurement.write',
    'claims.read', 'claims.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read', 'emergencies.write', 'analytics.read', 'staff.read', 'staff.write',
    'hospitals.read', 'settings.read'
  ],
  DOCTOR: [
    'dashboard.read', 'triage.read', 'patients.read', 'patients.write', 'transfers.read',
    'referrals.read', 'referrals.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read'
  ],
  NURSE: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'referrals.read'
  ],
  TRIAGE_OFFICER: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write'
  ],
  DISPATCHER: [
    'dashboard.read', 'dispatch.read', 'dispatch.write', 'ambulances.read', 'ambulances.write',
    'emergencies.read', 'emergencies.write'
  ],
  AMBULANCE_DRIVER: [
    'dashboard.read', 'dispatch.read', 'ambulances.read'
  ],
  FINANCE_OFFICER: [
    'dashboard.read', 'claims.read', 'claims.write', 'analytics.read'
  ],
  LAB_TECHNICIAN: [
    'dashboard.read', 'patients.read'
  ],
  PHARMACIST: [
    'dashboard.read', 'patients.read', 'resources.read'
  ]
} as const

export const MODULE_ICONS = {
  dashboard: 'LayoutDashboard',
  triage: 'Stethoscope',
  patients: 'Users',
  transfers: 'Truck',
  dispatch: 'Ambulance',
  referrals: 'ClipboardList',
  resources: 'Package',
  procurement: 'ShoppingCart',
  'sha-claims': 'FileText',
  telemedicine: 'Video',
  emergencies: 'Siren',
  analytics: 'BarChart3',
  staff: 'UserCog',
  hospitals: 'Building',
  settings: 'Settings'
} as const