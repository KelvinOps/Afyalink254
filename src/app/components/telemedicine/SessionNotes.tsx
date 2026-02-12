'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { FileText, User, Calendar } from 'lucide-react'
import { useToast } from '@/app/hooks/use-toast'

interface ClinicalNote {
  id: string
  content: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  createdByName: string
  type: 'CONSULTATION' | 'FOLLOWUP' | 'ASSESSMENT'
}

interface TelemedicineSession {
  id: string
  sessionNumber: string
  clinicalNotes?: ClinicalNote[]
  diagnosis?: string
  recommendations?: string
  specialist: {
    id: string
    firstName: string
    lastName: string
  }
}

interface CurrentUser {
  id: string
  name: string
  role: 'DOCTOR' | 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'NURSE' | 'PHARMACIST' | string
  firstName?: string
  lastName?: string
  email?: string
  facilityId?: string
}

interface SessionNotesProps {
  session: TelemedicineSession
  currentUser: CurrentUser
}

export function SessionNotes({ session, currentUser }: SessionNotesProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState<ClinicalNote[]>(session.clinicalNotes || [])

  const canEdit = currentUser.id === session.specialist.id || 
                 currentUser.role === 'SUPER_ADMIN' ||
                 currentUser.role === 'HOSPITAL_ADMIN'

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Empty Note",
        description: "Please enter some content for the note.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, you would call an API to add the note
      const mockNewNote: ClinicalNote = {
        id: `note-${Date.now()}`,
        content: newNote,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByName: currentUser.name,
        type: 'CONSULTATION'
      }

      setNotes(prev => [mockNewNote, ...prev])
      setNewNote('')
      
      toast({
        title: "Note Added",
        description: "Clinical note has been added successfully.",
      })
    } catch (error) {
      console.error('Error adding note:', error)
      toast({
        title: "Failed to Add Note",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'default'
      case 'FOLLOWUP':
        return 'secondary'
      case 'ASSESSMENT':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Note Section */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Add Clinical Note
            </CardTitle>
            <CardDescription>
              Document important observations, assessments, and follow-up requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote">Clinical Note</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your clinical observations, assessment, and recommendations..."
                className="min-h-[120px]"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                This note will be added to the patient's medical record
              </div>
              <Button 
                onClick={handleAddNote} 
                disabled={isLoading || !newNote.trim()}
              >
                {isLoading ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
          <CardDescription>
            All clinical documentation for this telemedicine session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getNoteTypeColor(note.type)}>
                          {note.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {note.createdByName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {note.updatedAt !== note.createdAt && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Last updated: {formatDate(note.updatedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Clinical Notes</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {canEdit 
                  ? "Start documenting this consultation by adding your first clinical note above."
                  : "No clinical notes have been documented for this session yet."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>
            Key information and outcomes from this consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Diagnosis</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm min-h-[80px]">
                {session.diagnosis || 'No diagnosis recorded'}
              </div>
            </div>
            
            <div>
              <Label>Recommendations</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm min-h-[80px]">
                {session.recommendations || 'No recommendations recorded'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Consulting Specialist: Dr. {session.specialist.firstName} {session.specialist.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Session: {session.sessionNumber}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note Templates */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Note Templates</CardTitle>
            <CardDescription>
              Quick templates for common clinical scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start text-left"
                onClick={() => setNewNote(prev => prev + '\n\nAssessment: Stable condition. Plan: Continue current management with follow-up in 2 weeks.')}
              >
                <div>
                  <div className="font-medium">Stable Follow-up</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    For stable patients requiring routine follow-up
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start text-left"
                onClick={() => setNewNote(prev => prev + '\n\nAssessment: Symptoms improved but requires monitoring. Plan: Adjust medication dosage and schedule follow-up in 1 week.')}
              >
                <div>
                  <div className="font-medium">Improved with Monitoring</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    For patients showing improvement but need close monitoring
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start text-left"
                onClick={() => setNewNote(prev => prev + '\n\nAssessment: No significant improvement. Plan: Consider alternative treatment options and schedule in-person evaluation.')}
              >
                <div>
                  <div className="font-medium">No Improvement</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    For cases where current treatment isn't effective
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start text-left"
                onClick={() => setNewNote(prev => prev + '\n\nAssessment: New concerning symptoms. Plan: Urgent in-person evaluation required. Patient advised to visit nearest facility.')}
              >
                <div>
                  <div className="font-medium">Urgent Referral</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    For cases requiring immediate in-person assessment
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}