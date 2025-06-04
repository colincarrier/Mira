'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Mic, Camera, FileText, Settings } from 'lucide-react'
import { NoteCard } from './components/NoteCard'
import { CaptureModal } from './components/CaptureModal'
import { BottomNavigation } from './components/BottomNavigation'
import type { NoteWithTodos } from '@/shared/schema'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'activity' | 'todos' | 'collections' | 'settings'>('activity')
  const [captureModalOpen, setCaptureModalOpen] = useState(false)
  const [captureMode, setCaptureMode] = useState<'text' | 'voice' | 'camera' | null>(null)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['/api/notes'],
    queryFn: async () => {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      return response.json() as Promise<NoteWithTodos[]>
    }
  })

  const handleNewNote = (mode: 'text' | 'voice' | 'camera') => {
    setCaptureMode(mode)
    setCaptureModalOpen(true)
  }

  if (activeView === 'activity') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold text-foreground">Mira</h1>
            <button
              onClick={() => setActiveView('settings')}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={() => handleNewNote('camera')}
            className="w-12 h-12 rounded-full bg-[#a8bfa1] hover:bg-[#9bb5a2] shadow-lg flex items-center justify-center transition-all"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => handleNewNote('voice')}
            className="w-12 h-12 rounded-full bg-[#9bb8d3] hover:bg-[#8aa9c4] shadow-lg flex items-center justify-center transition-all"
          >
            <Mic className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => handleNewNote('text')}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center transition-all"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4 border border-border">
                  <div className="h-4 bg-muted rounded skeleton mb-2"></div>
                  <div className="h-4 bg-muted rounded skeleton w-3/4"></div>
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-6">Start capturing your thoughts and ideas</p>
              <button
                onClick={() => handleNewNote('text')}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>

        {/* Capture Modal */}
        <CaptureModal
          isOpen={captureModalOpen}
          onClose={() => {
            setCaptureModalOpen(false)
            setCaptureMode(null)
          }}
          mode={captureMode}
        />

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeView}
          onTabChange={setActiveView}
        />
      </div>
    )
  }

  // Other views (todos, collections, settings) would go here
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
        <p className="text-muted-foreground">Coming soon...</p>
        <BottomNavigation
          activeTab={activeView}
          onTabChange={setActiveView}
        />
      </div>
    </div>
  )
}