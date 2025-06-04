import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzleClient'
import { notes, todos, collections } from '@/shared/schema'
import { eq, desc } from 'drizzle-orm'
import { analyzeNote } from '@/lib/ai/openai'

export async function GET() {
  try {
    const notesWithTodos = await db
      .select()
      .from(notes)
      .leftJoin(todos, eq(notes.id, todos.noteId))
      .leftJoin(collections, eq(notes.collectionId, collections.id))
      .orderBy(desc(notes.createdAt))

    // Group todos by note
    const notesMap = new Map()
    
    for (const row of notesWithTodos) {
      const noteId = row.notes.id
      
      if (!notesMap.has(noteId)) {
        notesMap.set(noteId, {
          ...row.notes,
          collection: row.collections,
          todos: []
        })
      }
      
      if (row.todos) {
        notesMap.get(noteId).todos.push(row.todos)
      }
    }

    const result = Array.from(notesMap.values())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, collectionId, mode = 'quick' } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Analyze content with AI
    let aiAnalysis
    try {
      aiAnalysis = await analyzeNote(content, mode)
    } catch (aiError) {
      console.warn('AI analysis failed, proceeding without it:', aiError)
      aiAnalysis = {
        complexityScore: 1,
        intentType: 'simple-task' as const,
        urgencyLevel: 'medium' as const,
        todos: []
      }
    }

    // Create note
    const [newNote] = await db
      .insert(notes)
      .values({
        content,
        aiAnalysis,
        collectionId: collectionId || null,
        enhancedContent: aiAnalysis.enhancedContent || null
      })
      .returning()

    // Create todos if extracted
    if (aiAnalysis.todos && aiAnalysis.todos.length > 0) {
      await db
        .insert(todos)
        .values(
          aiAnalysis.todos.map(todoTitle => ({
            title: todoTitle,
            noteId: newNote.id,
            completed: false,
            pinned: false,
            archived: false
          }))
        )
    }

    // Fetch the complete note with todos and collection
    const [completeNote] = await db
      .select()
      .from(notes)
      .leftJoin(todos, eq(notes.id, todos.noteId))
      .leftJoin(collections, eq(notes.collectionId, collections.id))
      .where(eq(notes.id, newNote.id))

    return NextResponse.json(completeNote, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}