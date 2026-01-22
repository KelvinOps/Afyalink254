'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { 
  FileText, 
  Save, 
  Plus,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface Session {
  id: string
  sessionNumber: string
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

interface ConsultationNote {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

interface ConsultationNotesProps {
  session: Session
  isCallActive: boolean
}

export function ConsultationNotes({ session, isCallActive }: ConsultationNotesProps) {
  const [notes, setNotes] = useState<ConsultationNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, you would fetch notes from your API
    const mockNotes: ConsultationNote[] = [
      {
        id: '1',
        content: 'Patient presents with mild fever and sore throat.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    setNotes(mockNotes)
  }, [session.id])

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      setError('Note cannot be empty')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // In a real app, you would save to your API
      const newNoteObj: ConsultationNote = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setNotes([...notes, newNoteObj])
      setNewNote('')
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (err) {
      setError('Failed to save note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Consultation Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {!isCallActive && session.status === 'SCHEDULED' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Start the call to add consultation notes.
            </AlertDescription>
          </Alert>
        )}

        {isCallActive && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add new note
              </label>
              <Textarea
                placeholder="Type your consultation notes here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                disabled={isSaving}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={isSaving || !newNote.trim()}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Previous Notes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Previous Notes</h4>
          {notes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <p className="text-sm">{note.content}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Follow-up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Templates */}
        {isCallActive && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Quick Templates</h4>
            <div className="flex flex-wrap gap-2">
              {['Vitals normal', 'Prescribed medication', 'Follow-up needed', 'Lab tests ordered'].map((template) => (
                <Button
                  key={template}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setNewNote(prev => prev ? `${prev}\n${template}` : template)}
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}