'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, CheckCircle, Circle, Pin, Archive } from 'lucide-react'
import type { NoteWithTodos } from '@/shared/schema'

interface NoteCardProps {
  note: NoteWithTodos
}

export function NoteCard({ note }: NoteCardProps) {
  const [showTodos, setShowTodos] = useState(false)

  const formatContent = (content: string) => {
    if (content.length > 200) {
      return content.substring(0, 200) + '...'
    }
    return content
  }

  const completedTodos = note.todos?.filter(todo => todo.completed) || []
  const incompleteTodos = note.todos?.filter(todo => !todo.completed) || []

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {note.collection && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{note.collection.icon}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {note.collection.name}
              </span>
            </div>
          )}
          <time className="text-xs text-muted-foreground">
            {format(new Date(note.createdAt!), 'MMM d, h:mm a')}
          </time>
        </div>
        <button className="p-1 rounded hover:bg-muted transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {formatContent(note.content)}
        </p>
      </div>

      {/* Todos */}
      {note.todos && note.todos.length > 0 && (
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowTodos(!showTodos)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <span>
              {completedTodos.length}/{note.todos.length} tasks completed
            </span>
          </button>

          {showTodos && (
            <div className="space-y-2">
              {incompleteTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{todo.title}</span>
                  {todo.pinned && <Pin className="w-3 h-3 text-primary" />}
                </div>
              ))}
              {completedTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2 opacity-60">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm line-through">{todo.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Indicator */}
      {note.aiAnalysis && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              AI Enhanced • Complexity: {(note.aiAnalysis as any).complexityScore || 'Unknown'}/10
            </span>
          </div>
        </div>
      )}
    </div>
  )
}