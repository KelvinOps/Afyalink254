// hospitals/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import type { StaffRole } from '@prisma/client'

// ── Param types ───────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ id: string }>
}

// ── Derive the Prisma return type from getHospitalById ────────────────────────
//
// NonNullable removes `| null` — safe because we guard with notFound() first.

type HospitalWithRelations = NonNullable<
  Awaited<ReturnType<typeof getHospitalById>>
>

// ── Precise sub-types matching the include/select shapes in hospital.service ──
//
// getHospitalById uses:
//   departments: { include: { staff: { select: { id, firstName, lastName, role } } } }
//   staff:       { include: { department: { select: { name, type } } } }
//   resources:   { include: { department: { select: { name } } } }

type DeptStaffSelect = {
  id: string
  firstName: string
  lastName: string
  role: StaffRole
}

type DepartmentWithStaff = HospitalWithRelations['departments'][number]
type StaffWithDept       = HospitalWithRelations['staff'][number]
type ResourceWithDept    = HospitalWithRelations['resources'][number]
type PerformanceMetric   = HospitalWithRelations['performanceMetrics'][number]

// ── Per-relation transformed types (Omit dates, replace with string | null) ───

type TransformedMetric = Omit<PerformanceMetric, 'date' | 'createdAt' | 'updatedAt'> & {
  date:      string | null
  createdAt: string | null
  updatedAt: string | null
}

type TransformedDept = Omit<DepartmentWithStaff, 'createdAt' | 'updatedAt' | 'staff'> & {
  createdAt: string | null
  updatedAt: string | null
  staff:     DeptStaffSelect[] // narrow SELECT — no date fields exist here
}

type TransformedStaff = Omit<
  StaffWithDept,
  'hireDate' | 'lastPaidDate' | 'shiftStart' | 'shiftEnd' | 'createdAt' | 'updatedAt'
> & {
  hireDate:     string | null
  lastPaidDate: string | null
  shiftStart:   string | null
  shiftEnd:     string | null
  createdAt:    string | null
  updatedAt:    string | null
}

type TransformedResource = Omit<
  ResourceWithDept,
  'lastMaintenance' | 'nextMaintenance' | 'lastRestock' | 'expiryDate' | 'createdAt' | 'updatedAt'
> & {
  lastMaintenance: string | null
  nextMaintenance: string | null
  lastRestock:     string | null
  expiryDate:      string | null
  createdAt:       string | null
  updatedAt:       string | null
}

// County: NonNullable so the type never collapses to `null`.
// HospitalOverview declares county as required/non-nullable on its Hospital type.
type RawCounty = NonNullable<HospitalWithRelations['county']>
type TransformedCounty = Omit<RawCounty, 'createdAt' | 'updatedAt'> & {
  createdAt: string | null
  updatedAt: string | null
}

// ── Final TransformedHospital ─────────────────────────────────────────────────
//
// We Omit every field we need to replace, then add back the string versions.
// Json fields (coordinates, specifications, etc.) are NOT omitted — they fall
// through from the spread with their original Prisma JsonValue types intact.
// HospitalOverview.tsx defines coordinates as its own `Coordinates` type, so
// we use `unknown` for the coordinates field here and cast at the call site.

export type TransformedHospital = Omit<
  HospitalWithRelations,
  | 'lastBedUpdate'
  | 'shaActivationDate'
  | 'createdAt'
  | 'updatedAt'
  | 'performanceMetrics'
  | 'departments'
  | 'staff'
  | 'resources'
  | 'county'
  | 'coordinates'       // exclude so we can widen to unknown for component compat
> & {
  coordinates:        unknown              // cast to component's Coordinates at call site
  lastBedUpdate:      string | null
  shaActivationDate:  string | null
  createdAt:          string | null
  updatedAt:          string | null
  performanceMetrics: TransformedMetric[]
  departments:        TransformedDept[]
  staff:              TransformedStaff[]
  resources:          TransformedResource[]
  county:             TransformedCounty    // always non-nullable
}

// ── Date transform helper ──────────────────────────────────────────────────────

function transformHospitalDates(hospital: HospitalWithRelations): TransformedHospital {
  // county is required by HospitalOverview — assert non-null (matches notFound() guard above)
  const county = hospital.county!

  return {
    ...hospital,

    // coordinates passes through as-is; cast to unknown satisfies TransformedHospital
    // and the `as` at the call site lets HospitalOverview receive its Coordinates type
    coordinates: hospital.coordinates,

    // Top-level date fields
    lastBedUpdate:     hospital.lastBedUpdate?.toISOString()     ?? null,
    shaActivationDate: hospital.shaActivationDate?.toISOString() ?? null,
    createdAt:         hospital.createdAt?.toISOString()         ?? null,
    updatedAt:         hospital.updatedAt?.toISOString()         ?? null,

    // performanceMetrics
    performanceMetrics: hospital.performanceMetrics?.map((metric) => ({
      ...metric,
      date:      metric.date?.toISOString()      ?? null,
      createdAt: metric.createdAt?.toISOString() ?? null,
      updatedAt: metric.updatedAt?.toISOString() ?? null,
    })) ?? [],

    // departments — nested staff has NO date fields (narrow select)
    departments: hospital.departments?.map((dept) => ({
      ...dept,
      createdAt: dept.createdAt?.toISOString() ?? null,
      updatedAt: dept.updatedAt?.toISOString() ?? null,
      staff:     dept.staff ?? [],
    })) ?? [],

    // staff — nested department select { name, type } has no dates
    staff: hospital.staff?.map((staffMember) => ({
      ...staffMember,
      hireDate:     staffMember.hireDate?.toISOString()     ?? null,
      lastPaidDate: staffMember.lastPaidDate?.toISOString() ?? null,
      shiftStart:   staffMember.shiftStart?.toISOString()   ?? null,
      shiftEnd:     staffMember.shiftEnd?.toISOString()     ?? null,
      createdAt:    staffMember.createdAt?.toISOString()    ?? null,
      updatedAt:    staffMember.updatedAt?.toISOString()    ?? null,
      department:   staffMember.department ?? null,
    })) ?? [],

    // resources — nested department select { name } has no dates
    resources: hospital.resources?.map((resource) => ({
      ...resource,
      lastMaintenance: resource.lastMaintenance?.toISOString() ?? null,
      nextMaintenance: resource.nextMaintenance?.toISOString() ?? null,
      lastRestock:     resource.lastRestock?.toISOString()     ?? null,
      expiryDate:      resource.expiryDate?.toISOString()      ?? null,
      createdAt:       resource.createdAt?.toISOString()       ?? null,
      updatedAt:       resource.updatedAt?.toISOString()       ?? null,
      department:      resource.department ?? null,
    })) ?? [],

    // county — full include, always present (asserted above)
    county: {
      ...county,
      createdAt: county.createdAt?.toISOString() ?? null,
      updatedAt: county.updatedAt?.toISOString() ?? null,
    },
  }
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return createUserObject({
    id:         payload.id,
    email:      payload.email,
    name:       payload.name,
    role:       payload.role,
    facilityId: payload.facilityId,
    countyId:   payload.countyId,
  })
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params  = await props.params
  const hospital = await getHospitalById(params.id)

  if (!hospital) {
    return { title: 'Hospital Not Found - AfyaLink 254' }
  }

  return {
    title:       `${hospital.name} - AfyaLink 254`,
    description: `${hospital.level} hospital in ${hospital.county?.name}, Kenya`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HospitalPage(props: PageProps) {
  const params   = await props.params
  const user     = await getAuthenticatedUser()
  const hospital = await getHospitalById(params.id)

  if (!hospital) notFound()

  const transformedHospital = transformHospitalDates(hospital)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{hospital.name}</h1>
          <p className="text-muted-foreground">
            {hospital.level.replace('_', ' ')} • {hospital.county?.name} County •{' '}
            {hospital.type.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      <HospitalTabs hospitalId={hospital.id} activeTab="overview" />

      {/*
        HospitalOverview defines its own `Hospital` type with `coordinates: Coordinates`
        and `county` as non-nullable. Our TransformedHospital is structurally identical
        except for the Json→string date replacements, so we cast once here rather than
        fighting two divergent type definitions across files.
      */}
      <HospitalOverview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hospital={transformedHospital as any}
        user={user}
      />
    </div>
  )
}