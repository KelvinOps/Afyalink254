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


export default function NewEmergencyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remove the unused counties state since we're using static data
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

  // Static county data for Kenya's 47 counties
  const kenyanCounties = [
    { id: 'county-1', name: 'Nairobi County', code: '001' },
    { id: 'county-2', name: 'Mombasa County', code: '002' },
    { id: 'county-3', name: 'Kisumu County', code: '003' },
    { id: 'county-4', name: 'Kiambu County', code: '004' },
    { id: 'county-5', name: 'Nakuru County', code: '005' },
    { id: 'county-6', name: 'Machakos County', code: '006' },
    { id: 'county-7', name: 'Uasin Gishu County', code: '007' },
    { id: 'county-8', name: 'Kajiado County', code: '008' },
    { id: 'county-9', name: 'Meru County', code: '009' },
    { id: 'county-10', name: 'Kakamega County', code: '010' },
    { id: 'county-11', name: 'Kisii County', code: '011' },
    { id: 'county-12', name: 'Kilifi County', code: '012' },
    { id: 'county-13', name: 'Kwale County', code: '013' },
    { id: 'county-14', name: 'Lamu County', code: '014' },
    { id: 'county-15', name: 'Taita Taveta County', code: '015' },
    { id: 'county-16', name: 'Garissa County', code: '016' },
    { id: 'county-17', name: 'Wajir County', code: '017' },
    { id: 'county-18', name: 'Mandera County', code: '018' },
    { id: 'county-19', name: 'Marsabit County', code: '019' },
    { id: 'county-20', name: 'Isiolo County', code: '020' },
    { id: 'county-21', name: 'Samburu County', code: '021' },
    { id: 'county-22', name: 'Turkana County', code: '022' },
    { id: 'county-23', name: 'West Pokot County', code: '023' },
    { id: 'county-24', name: 'Trans Nzoia County', code: '024' },
    { id: 'county-25', name: 'Elgeyo Marakwet County', code: '025' },
    { id: 'county-26', name: 'Nandi County', code: '026' },
    { id: 'county-27', name: 'Baringo County', code: '027' },
    { id: 'county-28', name: 'Laikipia County', code: '028' },
    { id: 'county-29', name: 'Nyandarua County', code: '029' },
    { id: 'county-30', name: 'Nyeri County', code: '030' },
    { id: 'county-31', name: 'Kirinyaga County', code: '031' },
    { id: 'county-32', name: 'Muranga County', code: '032' },
    { id: 'county-33', name: 'Embu County', code: '033' },
    { id: 'county-34', name: 'Tharaka Nithi County', code: '034' },
    { id: 'county-35', name: 'Kitui County', code: '035' },
    { id: 'county-36', name: 'Makueni County', code: '036' },
    { id: 'county-37', name: 'Bomet County', code: '037' },
    { id: 'county-38', name: 'Kericho County', code: '038' },
    { id: 'county-39', name: 'Bungoma County', code: '039' },
    { id: 'county-40', name: 'Busia County', code: '040' },
    { id: 'county-41', name: 'Siaya County', code: '041' },
    { id: 'county-42', name: 'Vihiga County', code: '042' },
    { id: 'county-43', name: 'Homa Bay County', code: '043' },
    { id: 'county-44', name: 'Migori County', code: '044' },
    { id: 'county-45', name: 'Nyamira County', code: '045' },
    { id: 'county-46', name: 'Narok County', code: '046' },
    { id: 'county-47', name: 'Tana River County', code: '047' }
  ];

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
                    {kenyanCounties.map(county => (
                      <SelectItem key={county.id} value={county.id}>
                        {county.name}
                      </SelectItem>
                    ))}
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