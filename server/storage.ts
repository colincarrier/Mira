import { notes, todos, collections, users, items, reminders, type Note, type Todo, type Collection, type User, type Item, type Reminder, type InsertNote, type InsertTodo, type InsertCollection, type InsertItem, type InsertReminder, type UpsertUser, type NoteWithTodos } from "@shared/schema";
import { db } from "./db";
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
    const allNotes = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt));

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
    try {
      // Filter out undefined and null values to prevent SQL errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
      );

      if (Object.keys(cleanUpdates).length === 0) {
        // If no valid updates, just return the existing note
        const existingNote = await this.getNote(id);
        if (!existingNote) throw new Error("Note not found");
        return existingNote;
      }

      const updatedNotes = await db
        .update(notes)
        .set(cleanUpdates)
        .where(eq(notes.id, id))
        .returning();

      if (!updatedNotes || updatedNotes.length === 0) {
        throw new Error("Note not found");
      }
      return updatedNotes[0];
    } catch (error: any) {
      console.error("Database update error:", error);
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
        due: todoData.due
      });

      const [newTodo] = await db
        .insert(todos)
        .values({
          title: todoData.title,
          completed: todoData.completed || false,
          priority: todoData.priority || 'medium',
          due: todoData.due,
          timeDue: todoData.timeDue,
          noteId: todoData.noteId,
          isTimeDependent: todoData.isTimeDependent || false,
          isActiveReminder: todoData.isActiveReminder || false,
          notificationSchedule: todoData.notificationSchedule || [],
          reminderType: todoData.reminderType || 'not_set',
          reminderCategory: todoData.reminderCategory || 'not_set',
          repeatPattern: todoData.repeatPattern || 'none',
          leadTimeNotifications: todoData.leadTimeNotifications || []
        })
        .returning();

      console.log("Successfully created todo/reminder:", newTodo);
      return newTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
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
      .orderBy(desc(todos.createdAt));

    return todosWithNotes as any;
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
      .values(insertItem])
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
}

export const storage = new DatabaseStorage();