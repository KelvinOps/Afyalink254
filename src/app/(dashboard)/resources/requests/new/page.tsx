// src/app/(dashboard)/resources/requests/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import { 
  Plus, 
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

// Define proper types for urgency and item type
type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type ItemType = 'MEDICAL_SUPPLY' | 'MEDICATION' | 'PPE' | 'LABORATORY_REAGENT' | 'SURGICAL_EQUIPMENT' | 'BLOOD_PRODUCT' | 'OTHER'

interface RequestItem {
  id: string
  name: string
  type: ItemType
  quantity: number
  unit: string
  urgency: UrgencyLevel
  estimatedCost: number
}

interface FormData {
  justification: string
  priority: UrgencyLevel
}

interface UrgencyOption {
  value: UrgencyLevel
  label: string
  color: string
}

export default function NewSupplyRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<RequestItem[]>([
    {
      id: '1',
      name: '',
      type: 'MEDICAL_SUPPLY',
      quantity: 1,
      unit: 'units',
      urgency: 'MEDIUM',
      estimatedCost: 0
    }
  ])
  const [formData, setFormData] = useState<FormData>({
    justification: '',
    priority: 'MEDIUM'
  })

  const addItem = (): void => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: '',
        type: 'MEDICAL_SUPPLY',
        quantity: 1,
        unit: 'units',
        urgency: 'MEDIUM',
        estimatedCost: 0
      }
    ])
  }

  const removeItem = (id: string): void => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = <K extends keyof RequestItem>(
    id: string, 
    field: K, 
    value: RequestItem[K]
  ): void => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const updateItemCost = (id: string, quantity: number, unitCost: number): void => {
    setItems(items.map(item => 
      item.id === id ? { ...item, estimatedCost: quantity * unitCost } : item
    ))
  }

  const totalEstimatedCost = items.reduce((sum, item) => sum + item.estimatedCost, 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/resources/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            urgency: item.urgency,
            estimatedCost: item.estimatedCost
          })),
          totalEstimatedCost,
          justification: formData.justification,
          priority: formData.priority
        }),
      })

      if (response.ok) {
        router.push('/resources/requests')
      } else {
        throw new Error('Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create supply request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const itemTypes: ItemType[] = [
    'MEDICAL_SUPPLY',
    'MEDICATION',
    'PPE',
    'LABORATORY_REAGENT',
    'SURGICAL_EQUIPMENT',
    'BLOOD_PRODUCT',
    'OTHER'
  ]

  const urgencyOptions: UrgencyOption[] = [
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' }
  ]

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resources/requests">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Supply Request</h1>
          <p className="text-muted-foreground">
            Create a new supply request for hospital resources
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Items */}
            <Card>
              <CardHeader>
                <CardTitle>Request Items</CardTitle>
                <CardDescription>
                  Add all items needed for this supply request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Item Name</label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Enter item name"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={item.type}
                          onChange={(e) => updateItem(item.id, 'type', e.target.value as ItemType)}
                          aria-label="Item type"
                        >
                          {itemTypes.map(type => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 1
                            updateItem(item.id, 'quantity', quantity)
                            const unitCost = item.estimatedCost / (item.quantity || 1)
                            updateItemCost(item.id, quantity, unitCost || 0)
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Unit</label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          placeholder="e.g., boxes, units, packs"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Unit Cost (KES)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity > 0 ? (item.estimatedCost / item.quantity).toFixed(2) : 0}
                          onChange={(e) => {
                            const unitCost = parseFloat(e.target.value) || 0
                            updateItemCost(item.id, item.quantity, unitCost)
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Urgency</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={item.urgency}
                          onChange={(e) => updateItem(item.id, 'urgency', e.target.value as UrgencyLevel)}
                          aria-label="Item urgency"
                        >
                          {urgencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Item Total:</span>
                      <span className="font-semibold">{formatCurrency(item.estimatedCost)}</span>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Item
                </Button>
              </CardContent>
            </Card>

            {/* Justification */}
            <Card>
              <CardHeader>
                <CardTitle>Justification</CardTitle>
                <CardDescription>
                  Explain why these supplies are needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  placeholder="Provide detailed justification for this supply request..."
                  rows={5}
                  required
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Overall Priority</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as UrgencyLevel})}
                    aria-label="Overall request priority"
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Number of Items:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Estimated Cost:</span>
                    <span className="font-semibold text-lg">{formatCurrency(totalEstimatedCost)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Approval Process</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Head of Department:</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Required
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hospital Admin:</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Required
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>County Health:</span>
                      {totalEstimatedCost > 50000 ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Not Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Items by Urgency</h4>
                  <div className="space-y-2">
                    {urgencyOptions.map(option => {
                      const count = items.filter(item => item.urgency === option.value).length
                      if (count === 0) return null
                      return (
                        <div key={option.value} className="flex justify-between items-center text-sm">
                          <span>{option.label}:</span>
                          <Badge className={option.color}>
                            {count} item{count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Request...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/resources/requests">
                      Cancel
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}