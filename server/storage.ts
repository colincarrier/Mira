import { notes, todos, collections, type Note, type Todo, type Collection, type InsertNote, type InsertTodo, type InsertCollection, type NoteWithTodos } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Notes
  createNote(note: InsertNote): Promise<Note>;
  getNotes(): Promise<NoteWithTodos[]>;
  getNote(id: number): Promise<NoteWithTodos | undefined>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;
  
  // Todos
  createTodo(todo: InsertTodo): Promise<Todo>;
  getTodos(): Promise<Todo[]>;
  getTodosByNoteId(noteId: number): Promise<Todo[]>;
  updateTodo(id: number, updates: Partial<Todo>): Promise<Todo>;
  
  // Collections
  createCollection(collection: InsertCollection): Promise<Collection>;
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  getNotesByCollectionId(collectionId: number): Promise<NoteWithTodos[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    // User functionality not implemented yet
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // User functionality not implemented yet
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // User functionality not implemented yet
    throw new Error("User functionality not implemented");
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async getNotes(): Promise<NoteWithTodos[]> {
    const allNotes = await db
      .select()
      .from(notes)
      .orderBy(notes.createdAt);
    
    const notesWithTodos = await Promise.all(
      allNotes.map(async (note) => {
        const noteTodos = await this.getTodosByNoteId(note.id);
        const collection = note.collectionId 
          ? await this.getCollection(note.collectionId) 
          : undefined;
        return { ...note, todos: noteTodos, collection };
      })
    );
    
    return notesWithTodos.reverse(); // Most recent first
  }

  async getNote(id: number): Promise<NoteWithTodos | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    if (!note) return undefined;
    
    const noteTodos = await this.getTodosByNoteId(id);
    const collection = note.collectionId 
      ? await this.getCollection(note.collectionId) 
      : undefined;
    return { ...note, todos: noteTodos, collection };
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, id))
      .returning();
    
    if (!note) throw new Error("Note not found");
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    // First delete all associated todos
    await db.delete(todos).where(eq(todos.noteId, id));
    // Then delete the note
    await db.delete(notes).where(eq(notes.id, id));
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const [todo] = await db
      .insert(todos)
      .values(insertTodo)
      .returning();
    return todo;
  }

  async getTodos(): Promise<Todo[]> {
    const todosWithNotes = await db
      .select({
        id: todos.id,
        title: todos.title,
        completed: todos.completed,
        pinned: todos.pinned,
        archived: todos.archived,
        priority: todos.priority,
        noteId: todos.noteId,
        createdAt: todos.createdAt,
        noteTitle: notes.content,
        noteAiEnhanced: notes.aiEnhanced
      })
      .from(todos)
      .leftJoin(notes, eq(todos.noteId, notes.id))
      .orderBy(todos.createdAt);
    
    return todosWithNotes as any;
  }

  async getTodosByNoteId(noteId: number): Promise<Todo[]> {
    return await db
      .select()
      .from(todos)
      .where(eq(todos.noteId, noteId))
      .orderBy(todos.createdAt);
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo> {
    const [todo] = await db
      .update(todos)
      .set(updates)
      .where(eq(todos.id, id))
      .returning();
    
    if (!todo) throw new Error("Todo not found");
    return todo;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async getCollections(): Promise<Collection[]> {
    return await db
      .select()
      .from(collections)
      .orderBy(collections.createdAt);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async getNotesByCollectionId(collectionId: number): Promise<NoteWithTodos[]> {
    const collectionNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.collectionId, collectionId))
      .orderBy(notes.createdAt);
    
    const notesWithTodos = await Promise.all(
      collectionNotes.map(async (note) => {
        const noteTodos = await this.getTodosByNoteId(note.id);
        const collection = await this.getCollection(collectionId);
        return { ...note, todos: noteTodos, collection };
      })
    );
    
    return notesWithTodos.reverse(); // Most recent first
  }
}

export const storage = new DatabaseStorage();
