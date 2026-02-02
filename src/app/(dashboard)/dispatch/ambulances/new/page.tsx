// dispatch/ambulances/new/page.tsx 

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Save, Hospital, Shield, Calendar } from 'lucide-react'
import { useToast } from '@/app/hooks/use-toast'

// Define separate schemas for hospital and county ambulances
const hospitalAmbulanceSchema = z.object({
  ambulanceType: z.literal('HOSPITAL'),
  registrationNumber: z.string()
    .min(3, 'Registration number must be at least 3 characters')
    .max(20, 'Registration number must be at most 20 characters'),
  type: z.enum(['BLS', 'ALS', 'CRITICAL_CARE', 'AIR_AMBULANCE', 'PATIENT_TRANSPORT', 'MOBILE_CLINIC']),
  equipmentLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'CRITICAL_CARE']),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  driverLicense: z.string().optional(),
  paramedicName: z.string().optional(),
  paramedicLicense: z.string().optional(),
  crewSize: z.number().min(1).max(6).default(2),
  hasGPS: z.boolean().default(false),
  hasRadio: z.boolean().default(true),
  hasOxygen: z.boolean().default(true),
  hasDefibrillator: z.boolean().default(false),
  hasVentilator: z.boolean().default(false),
  hasMonitor: z.boolean().default(false),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  mileage: z.number().min(0).optional(),
  odometerReading: z.number().min(0).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  isOperational: z.boolean().default(true),
})

const countyAmbulanceSchema = z.object({
  ambulanceType: z.literal('COUNTY'),
  registrationNumber: z.string()
    .min(3, 'Registration number must be at least 3 characters')
    .max(20, 'Registration number must be at most 20 characters'),
  type: z.enum(['BLS', 'ALS', 'CRITICAL_CARE', 'AIR_AMBULANCE', 'PATIENT_TRANSPORT', 'MOBILE_CLINIC']),
  equipmentLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'CRITICAL_CARE']),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  baseStation: z.string().min(1, 'Base station is required'),
  baseCoordinates: z.string().optional(),
  hasGPS: z.boolean().default(false),
  hasRadio: z.boolean().default(true),
  hasOxygen: z.boolean().default(true),
  hasDefibrillator: z.boolean().default(false),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  mileage: z.number().min(0).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  isOperational: z.boolean().default(true),
})

type HospitalAmbulanceFormData = z.infer<typeof hospitalAmbulanceSchema>
type CountyAmbulanceFormData = z.infer<typeof countyAmbulanceSchema>

// Hospital Ambulance Form Component
const HospitalAmbulanceForm = ({ 
  onSubmit, 
  isSubmitting 
}: { 
  onSubmit: (data: HospitalAmbulanceFormData) => Promise<void>
  isSubmitting: boolean 
}) => {
  const router = useRouter()
  
  const form = useForm<HospitalAmbulanceFormData>({
    resolver: zodResolver(hospitalAmbulanceSchema),
    defaultValues: {
      ambulanceType: 'HOSPITAL',
      type: 'BLS',
      equipmentLevel: 'BASIC',
      crewSize: 2,
      hasGPS: false,
      hasRadio: true,
      hasOxygen: true,
      hasDefibrillator: false,
      hasVentilator: false,
      hasMonitor: false,
      isOperational: true,
      fuelLevel: 100,
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5" />
              Hospital Ambulance Details
            </CardTitle>
            <CardDescription>
              Enter details for a hospital-managed ambulance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., KAA 123A" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Official vehicle registration number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambulance Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BLS">BLS (Basic Life Support)</SelectItem>
                        <SelectItem value="ALS">ALS (Advanced Life Support)</SelectItem>
                        <SelectItem value="CRITICAL_CARE">Critical Care</SelectItem>
                        <SelectItem value="AIR_AMBULANCE">Air Ambulance</SelectItem>
                        <SelectItem value="PATIENT_TRANSPORT">Patient Transport</SelectItem>
                        <SelectItem value="MOBILE_CLINIC">Mobile Clinic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipmentLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="CRITICAL_CARE">Critical Care</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="07xx xxx xxx" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver License</FormLabel>
                    <FormControl>
                      <Input placeholder="License number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crewSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crew Size</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="6" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paramedicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paramedic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Paramedic's full name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paramedicLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paramedic License</FormLabel>
                    <FormControl>
                      <Input placeholder="License number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Last maintenance date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Next scheduled maintenance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odometerReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Level (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isOperational"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Operational Status</FormLabel>
                    <FormDescription>
                      Check if the ambulance is ready for service
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Equipment Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Checklist</CardTitle>
            <CardDescription>
              Select available equipment in this ambulance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hasGPS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>GPS Navigation</FormLabel>
                      <FormDescription>
                        Real-time location tracking
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasRadio"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Radio Communication</FormLabel>
                      <FormDescription>
                        Emergency communication system
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasOxygen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Oxygen Supply</FormLabel>
                      <FormDescription>
                        Medical oxygen cylinders
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasDefibrillator"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Defibrillator</FormLabel>
                      <FormDescription>
                        AED with monitoring
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasVentilator"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ventilator</FormLabel>
                      <FormDescription>
                        Mechanical ventilation system
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasMonitor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Patient Monitor</FormLabel>
                      <FormDescription>
                        Vital signs monitoring
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dispatch/ambulances')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Hospital Ambulance
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// County Ambulance Form Component
const CountyAmbulanceForm = ({ 
  onSubmit, 
  isSubmitting 
}: { 
  onSubmit: (data: CountyAmbulanceFormData) => Promise<void>
  isSubmitting: boolean 
}) => {
  const router = useRouter()
  
  const form = useForm<CountyAmbulanceFormData>({
    resolver: zodResolver(countyAmbulanceSchema),
    defaultValues: {
      ambulanceType: 'COUNTY',
      type: 'BLS',
      equipmentLevel: 'BASIC',
      hasGPS: false,
      hasRadio: true,
      hasOxygen: true,
      hasDefibrillator: false,
      isOperational: true,
      fuelLevel: 100,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              County Ambulance Details
            </CardTitle>
            <CardDescription>
              Enter details for a county-managed ambulance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., KAA 123A" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Official vehicle registration number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambulance Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BLS">BLS (Basic Life Support)</SelectItem>
                        <SelectItem value="ALS">ALS (Advanced Life Support)</SelectItem>
                        <SelectItem value="CRITICAL_CARE">Critical Care</SelectItem>
                        <SelectItem value="AIR_AMBULANCE">Air Ambulance</SelectItem>
                        <SelectItem value="PATIENT_TRANSPORT">Patient Transport</SelectItem>
                        <SelectItem value="MOBILE_CLINIC">Mobile Clinic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipmentLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="CRITICAL_CARE">Critical Care</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="07xx xxx xxx" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="baseStation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Station *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Nakuru Main Station, Kisumu West" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Primary station or sub-county where ambulance is based
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseCoordinates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Coordinates (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., -1.2921, 36.8219 or what3words address" 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    GPS coordinates or what3words location of base station
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Last maintenance date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Next scheduled maintenance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fuelLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Level (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOperational"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Operational Status</FormLabel>
                    <FormDescription>
                      Check if the ambulance is ready for service
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Equipment Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Checklist</CardTitle>
            <CardDescription>
              Select available equipment in this ambulance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hasGPS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>GPS Navigation</FormLabel>
                      <FormDescription>
                        Real-time location tracking
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasRadio"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Radio Communication</FormLabel>
                      <FormDescription>
                        Emergency communication system
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasOxygen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Oxygen Supply</FormLabel>
                      <FormDescription>
                        Medical oxygen cylinders
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasDefibrillator"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Defibrillator</FormLabel>
                      <FormDescription>
                        AED with monitoring
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dispatch/ambulances')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create County Ambulance
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default function NewAmbulancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ambulanceType, setAmbulanceType] = useState<'HOSPITAL' | 'COUNTY'>('HOSPITAL')

  const handleSubmit = async (data: HospitalAmbulanceFormData | CountyAmbulanceFormData) => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/dispatch/ambulances', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ambulance')
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: `${data.ambulanceType === 'HOSPITAL' ? 'Hospital' : 'County'} ambulance ${data.registrationNumber} created successfully`,
      })

      router.push(`/dispatch/ambulances/${result.ambulance.id}`)
    } catch (error) {
      console.error('Error creating ambulance:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ambulance',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dispatch/ambulances')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Ambulance</h1>
          <p className="text-muted-foreground">
            Register a new ambulance to the fleet
          </p>
        </div>
      </div>

      {/* Ambulance Type Selection */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>Ambulance Type</Label>
            <RadioGroup 
              value={ambulanceType} 
              onValueChange={(value: 'HOSPITAL' | 'COUNTY') => setAmbulanceType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="HOSPITAL" id="hospital" className="peer sr-only" />
                <Label
                  htmlFor="hospital"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Hospital className="mb-3 h-6 w-6" />
                  Hospital Ambulance
                  <p className="text-sm text-muted-foreground mt-1">Managed by specific hospital</p>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="COUNTY" id="county" className="peer sr-only" />
                <Label
                  htmlFor="county"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Shield className="mb-3 h-6 w-6" />
                  County Ambulance
                  <p className="text-sm text-muted-foreground mt-1">Managed by county government</p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Render the appropriate form */}
      {ambulanceType === 'HOSPITAL' ? (
        <HospitalAmbulanceForm 
          onSubmit={handleSubmit as (data: HospitalAmbulanceFormData) => Promise<void>} 
          isSubmitting={isSubmitting} 
        />
      ) : (
        <CountyAmbulanceForm 
          onSubmit={handleSubmit as (data: CountyAmbulanceFormData) => Promise<void>} 
          isSubmitting={isSubmitting} 
        />
      )}
    </div>
  )
}