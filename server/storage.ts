import { notes, todos, collections, users, items, reminders, collectionItems, type Note, type Todo, type Collection, type User, type Item, type Reminder, type InsertNote, type InsertTodo, type InsertCollection, type InsertItem, type InsertReminder, type UpsertUser, type NoteWithTodos } from "@shared/schema";
import { db } from "./db";

// Export db for Intelligence-V2 components
export { db };
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (for future auth implementation)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Notes
  createNote(note: InsertNote): Promise<Note>;
  getNotes(userId?: string): Promise<NoteWithTodos[]>;
  getNote(id: number): Promise<NoteWithTodos | undefined>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Todos
  createTodo(todo: InsertTodo): Promise<Todo>;
  getTodos(): Promise<Todo[]>;
  getTodosByNoteId(noteId: number): Promise<Todo[]>;
  updateTodo(id: number, updates: Partial<Todo>): Promise<Todo>;
  deleteTodo(id: number): Promise<void>;

  // Collections
  createCollection(collection: InsertCollection): Promise<Collection>;
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  updateCollection(id: number, updates: Partial<Collection>): Promise<Collection>;
  getNotesByCollectionId(collectionId: number): Promise<NoteWithTodos[]>;

  // Items
  createItem(item: InsertItem): Promise<Item>;
  getItems(): Promise<Item[]>;
  getItemsByNoteId(noteId: number): Promise<Item[]>;
  getItemsByCollectionId(collectionId: number): Promise<Item[]>;
  updateItem(id: number, updates: Partial<Item>): Promise<Item>;
  deleteItem(id: number): Promise<void>;

  // Reminders
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getReminders(): Promise<Reminder[]>;

  // Intelligence-v2 extensions
  getAllNotes(): Promise<Note[]>;
  getNotesWithVectors(): Promise<Note[]>;
  updateNoteVectors(id: number, vectorDense: string, vectorSparse: string): Promise<void>;
  storeRelationships?(noteId: string, relationships: any[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values([insertNote])
      .returning();
    return note;
  }

  async getNotes(): Promise<NoteWithTodos[]> {
    // Optimized: Get all data in parallel batches instead of N+1 queries
    const [allNotes, allTodos, allCollections] = await Promise.all([
      db.select({
        id: notes.id,
        content: notes.content,
        aiGeneratedTitle: notes.aiGeneratedTitle,
        mode: notes.mode,
        userId: notes.userId,
        isShared: notes.isShared,
        shareId: notes.shareId,
        privacyLevel: notes.privacyLevel,
        createdAt: notes.createdAt,
        audioUrl: notes.audioUrl,
        mediaUrl: notes.mediaUrl,
        transcription: notes.transcription,
        imageData: notes.imageData,
        aiEnhanced: notes.aiEnhanced,
        aiSuggestion: notes.aiSuggestion,
        aiContext: notes.aiContext,
        richContext: notes.richContext,
        isProcessing: notes.isProcessing,
        collectionId: notes.collectionId,
        // Exclude heavy vector data from list view
        version: notes.version,
        originalContent: notes.originalContent,
        lastUserEdit: notes.lastUserEdit,
        protectedContent: notes.protectedContent,
        processingPath: notes.processingPath,
        classificationScores: notes.classificationScores
      }).from(notes).orderBy(desc(notes.createdAt)).limit(50), // Limit to 50 most recent notes
      db.select().from(todos).limit(200), // Limit todos query
      db.select().from(collections).limit(20) // Limit collections query
    ]);

    // Group todos by noteId for efficient lookup
    const todosByNoteId = allTodos.reduce((acc, todo) => {
      if (!acc[todo.noteId]) acc[todo.noteId] = [];
      acc[todo.noteId].push(todo);
      return acc;
    }, {} as Record<number, Todo[]>);

    // Group collections by id for efficient lookup
    const collectionsById = allCollections.reduce((acc, collection) => {
      acc[collection.id] = collection;
      return acc;
    }, {} as Record<number, Collection>);

    // Combine data efficiently
    const notesWithTodos = allNotes.map(note => ({
      ...note,
      todos: todosByNoteId[note.id] || [],
      collection: note.collectionId ? collectionsById[note.collectionId] : undefined,
      // Add missing fields with defaults
      vectorDense: null,
      vectorSparse: null,
      intentVector: null
    }));

    return notesWithTodos;
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
    console.log(`[Storage] Updating note ${id} with keys:`, Object.keys(updates));
    console.log(`[Storage] Update values:`, JSON.stringify(updates, null, 2));
    
    try {
      // Filter out undefined values but keep null values (they might be intentional)
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanUpdates).length === 0) {
        console.log(`[Storage] No valid updates for note ${id}, returning existing`);
        const existingNote = await this.getNote(id);
        if (!existingNote) throw new Error("Note not found");
        return existingNote;
      }

      console.log(`[Storage] Executing update with cleaned data:`, cleanUpdates);
      
      const updatedNotes = await db
        .update(notes)
        .set(cleanUpdates)
        .where(eq(notes.id, id))
        .returning();

      if (!updatedNotes || updatedNotes.length === 0) {
        throw new Error("Note not found");
      }
      
      console.log(`[Storage] Update successful for note ${id}`);
      const result = updatedNotes[0];
      console.log(`[Storage] Verification - aiEnhanced: ${result.aiEnhanced}, richContext length: ${result.richContext?.length || 0}`);
      
      return result;
    } catch (error: any) {
      console.error(`[Storage] Database update error for note ${id}:`, error);
      console.error(`[Storage] Failed update payload:`, updates);
      throw new Error(`Failed to update note: ${error.message}`);
    }
  }

  async deleteNote(id: number): Promise<void> {
    // First delete all associated todos
    await db.delete(todos).where(eq(todos.noteId, id));
    // Then delete the note
    await db.delete(notes).where(eq(notes.id, id));
  }

  async createTodo(todoData: InsertTodo): Promise<Todo> {
    try {
      console.log("Creating todo/reminder with data:", {
        title: todoData.title,
        isActiveReminder: todoData.isActiveReminder,
        timeDue: todoData.timeDue,
        priority: todoData.priority
      });

      // Create the todo values object, only including defined fields
      const todoValues: any = {
        title: todoData.title,
        completed: todoData.completed || false,
        priority: todoData.priority || 'medium',
        noteId: todoData.noteId,
        isActiveReminder: todoData.isActiveReminder || false,
        pinned: todoData.pinned || false,
        archived: todoData.archived || false
      };

      // Only add timeDue if it's provided
      if (todoData.timeDue) {
        todoValues.timeDue = todoData.timeDue;
      }

      // Add notification structure if provided
      if (todoData.plannedNotificationStructure) {
        todoValues.plannedNotificationStructure = todoData.plannedNotificationStructure;
      } else if (todoData.isActiveReminder) {
        // Default notification structure for reminders
        todoValues.plannedNotificationStructure = {
          enabled: true,
          reminderCategory: "today",
          repeatPattern: "none",
          leadTimeNotifications: ["15 minutes before"]
        };
      }

      const [newTodo] = await db
        .insert(todos)
        .values(todoValues)
        .returning();

      console.log("Successfully created todo/reminder:", newTodo);
      return newTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  }

  async getTodos(): Promise<Todo[]> {
    return await db
      .select()
      .from(todos)
      .orderBy(desc(todos.createdAt));
  }

  async getTodosByNoteId(noteId: number): Promise<Todo[]> {
    return await db
      .select()
      .from(todos)
      .where(eq(todos.noteId, noteId))
      .orderBy(desc(todos.createdAt));
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

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
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
      .orderBy(collections.displayOrder, collections.createdAt);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection> {
    const [collection] = await db
      .update(collections)
      .set(updates)
      .where(eq(collections.id, id))
      .returning();
    if (!collection) throw new Error("Collection not found");
    return collection;
  }

  async getNotesByCollectionId(collectionId: number): Promise<NoteWithTodos[]> {
    const collectionNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.collectionId, collectionId))
      .orderBy(desc(notes.createdAt));

    const notesWithTodos = await Promise.all(
      collectionNotes.map(async (note) => {
        const noteTodos = await this.getTodosByNoteId(note.id);
        const collection = await this.getCollection(collectionId);
        return { ...note, todos: noteTodos, collection };
      })
    );

    return notesWithTodos; // Already sorted newest first
  }

  // Items operations
  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }

  async getItems(): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .orderBy(desc(items.createdAt));
  }

  async getItemsByNoteId(noteId: number): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.sourceNoteId, noteId))
      .orderBy(desc(items.createdAt));
  }

  async getItemsByCollectionId(collectionId: number): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.collectionId, collectionId))
      .orderBy(desc(items.createdAt));
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item> {
    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    if (!item) throw new Error("Item not found");
    return item;
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  // Reminder operations
  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async getReminders(): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.isCompleted, false))
      .orderBy(reminders.reminderTime);
  }

  // Intelligence-v2 implementations
  async getAllNotes(): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt));
  }

  async getNotesWithVectors(): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt));
  }

  async updateNoteVectors(id: number, vectorDense: string, vectorSparse: string): Promise<void> {
    await db
      .update(notes)
      .set({
        vectorDense,
        vectorSparse
      })
      .where(eq(notes.id, id));
  }

  async storeRelationships(noteId: string, relationships: any[]): Promise<void> {
    // Store relationships in note metadata for now
    // Can be expanded to dedicated relationship table later
    const id = parseInt(noteId);
    if (isNaN(id)) return;

    const relationshipData = {
      relationships: relationships.map(rel => ({
        type: rel.type,
        targetId: rel.targetId,
        strength: rel.strength,
        context: rel.context,
        discoveredAt: rel.discoveredAt
      }))
    };

    await db
      .update(notes)
      .set({
        richContext: JSON.stringify(relationshipData)
      })
      .where(eq(notes.id, id));
  }
}

export const storage = new DatabaseStorage();

// V3 Helper Functions
export async function getUserPatterns(userId: string) {
  return { summary: 'No pattern data yet' };
}

export async function getCollectionHints(text: string) {
  // naïve keyword mapping – upgrade later
  if (/ticket|game/.test(text))   return [{ name: 'events' }];
  if (/flight|trip|hotel/.test(text)) return [{ name: 'travel' }];
  return [{ name: 'general' }];
}

export async function getRecentNotes(userId: string, limit = 5) {
  const result = await db.select({ content: notes.content })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt))
    .limit(limit);
  return result.map(r => r.content);
}