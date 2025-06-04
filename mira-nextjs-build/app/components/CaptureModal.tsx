'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Mic, Camera, Type, Send, Square } from 'lucide-react'

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'text' | 'voice' | 'camera' | null
}

export function CaptureModal({ isOpen, onClose, mode }: CaptureModalProps) {
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const queryClient = useQueryClient()

  const createNoteMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent, mode: 'quick' })
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] })
      setContent('')
      setRecordingBlob(null)
      onClose()
    },
    onError: (error) => {
      console.error('Failed to create note:', error)
    }
  })

  const transcribeAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) throw new Error('Failed to transcribe audio')
      return response.json()
    },
    onSuccess: (data) => {
      setContent(data.text)
      setRecordingBlob(null)
    }
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setRecordingBlob(blob)
        transcribeAudioMutation.mutate(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = () => {
    if (content.trim()) {
      createNoteMutation.mutate(content.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:w-96 sm:rounded-lg border-t sm:border border-border max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {mode === 'voice' ? 'Voice Note' : mode === 'camera' ? 'Camera Note' : 'New Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {mode === 'voice' && (
            <div className="text-center space-y-4">
              {!isRecording && !recordingBlob && (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-[#9bb8d3] hover:bg-[#8aa9c4] flex items-center justify-center mx-auto transition-all"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              )}
              
              {isRecording && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto recording-pulse">
                    <Square className="w-8 h-8 text-white" />
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Stop Recording
                  </button>
                </div>
              )}
              
              {transcribeAudioMutation.isPending && (
                <div className="text-muted-foreground">Transcribing audio...</div>
              )}
            </div>
          )}

          {mode === 'camera' && (
            <div className="text-center space-y-4">
              <button className="w-20 h-20 rounded-full bg-[#a8bfa1] hover:bg-[#9bb5a2] flex items-center justify-center mx-auto transition-all">
                <Camera className="w-8 h-8 text-white" />
              </button>
              <p className="text-muted-foreground">Camera capture coming soon</p>
            </div>
          )}

          {(mode === 'text' || content) && (
            <div className="space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                autoFocus={mode === 'text'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {content && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleSubmit}
              disabled={createNoteMutation.isPending || !content.trim()}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createNoteMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Save Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}