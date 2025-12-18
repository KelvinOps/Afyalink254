'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';

interface County {
  id: string;
  name: string;
  code: string;
}

export default function NewEmergencyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counties, setCounties] = useState<County[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    countyId: '',
    location: '',
    coordinates: { lat: 0, lng: 0 },
    description: '',
    cause: '',
    estimatedCasualties: '',
    reportedBy: '',
    reporterPhone: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.type) errors.type = 'Emergency type is required';
    if (!formData.severity) errors.severity = 'Severity level is required';
    if (!formData.countyId) errors.countyId = 'County is required';
    if (!formData.location) errors.location = 'Location is required';
    if (!formData.description) errors.description = 'Description is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedCasualties: formData.estimatedCasualties ? parseInt(formData.estimatedCasualties) : undefined,
          coordinates: formData.coordinates.lat && formData.coordinates.lng ? formData.coordinates : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create emergency');
      }

      const emergency = await response.json();
      router.push(`/emergencies/${emergency.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const emergencyTypes = [
    'TRAFFIC_ACCIDENT', 'MASS_CASUALTY', 'NATURAL_DISASTER', 'FIRE', 
    'MEDICAL', 'TRAUMA', 'OBSTETRIC', 'PEDIATRIC', 'CARDIAC', 
    'STROKE', 'RESPIRATORY', 'DROWNING', 'POISONING', 'ASSAULT', 'OTHER'
  ];

  const severityLevels = ['MINOR', 'MODERATE', 'SEVERE', 'MAJOR', 'CATASTROPHIC'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report New Emergency</h1>
          <p className="text-muted-foreground">
            Create a new emergency incident for immediate response coordination
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Emergency Details</CardTitle>
          <CardDescription>
            Provide all available information about the emergency situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emergency Type *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select emergency type" />
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-sm text-red-500">{formErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Severity Level *</label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleInputChange('severity', value)}
                >
                  <SelectTrigger className={formErrors.severity ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map(severity => (
                      <SelectItem key={severity} value={severity}>
                        {severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.severity && (
                  <p className="text-sm text-red-500">{formErrors.severity}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">County *</label>
                <Select
                  value={formData.countyId}
                  onValueChange={(value) => handleInputChange('countyId', value)}
                >
                  <SelectTrigger className={formErrors.countyId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* In real app, map through counties from API */}
                    <SelectItem value="county-1">Nairobi County</SelectItem>
                    <SelectItem value="county-2">Mombasa County</SelectItem>
                    <SelectItem value="county-3">Kisumu County</SelectItem>
                    {/* Add all 47 counties */}
                  </SelectContent>
                </Select>
                {formErrors.countyId && (
                  <p className="text-sm text-red-500">{formErrors.countyId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location *</label>
                <Input
                  placeholder="Specific location or landmark"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={formErrors.location ? 'border-red-500' : ''}
                />
                {formErrors.location && (
                  <p className="text-sm text-red-500">{formErrors.location}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Coordinates (Optional)</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={formData.coordinates.lat || ''}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={formData.coordinates.lng || ''}
                  onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Provide detailed description of the emergency situation..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cause (If known)</label>
                <Input
                  placeholder="What caused the emergency?"
                  value={formData.cause}
                  onChange={(e) => handleInputChange('cause', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Casualties</label>
                <Input
                  type="number"
                  placeholder="Number of people affected"
                  value={formData.estimatedCasualties}
                  onChange={(e) => handleInputChange('estimatedCasualties', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reported By</label>
                <Input
                  placeholder="Name of person reporting"
                  value={formData.reportedBy}
                  onChange={(e) => handleInputChange('reportedBy', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reporter Phone</label>
                <Input
                  placeholder="Phone number for follow-up"
                  value={formData.reporterPhone}
                  onChange={(e) => handleInputChange('reporterPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Emergency...' : 'Create Emergency'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}