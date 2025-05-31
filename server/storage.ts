import { notes, todos, collections, type Note, type Todo, type Collection, type InsertNote, type InsertTodo, type InsertCollection, type NoteWithTodos } from "@shared/schema";

export interface IStorage {
  // Notes
  createNote(note: InsertNote): Promise<Note>;
  getNotes(): Promise<NoteWithTodos[]>;
  getNote(id: number): Promise<NoteWithTodos | undefined>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note>;
  
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

export class MemStorage implements IStorage {
  private notes: Map<number, Note>;
  private todos: Map<number, Todo>;
  private collections: Map<number, Collection>;
  private currentNoteId: number;
  private currentTodoId: number;
  private currentCollectionId: number;

  constructor() {
    this.notes = new Map();
    this.todos = new Map();
    this.collections = new Map();
    this.currentNoteId = 1;
    this.currentTodoId = 1;
    this.currentCollectionId = 1;
    
    // Initialize with some default collections
    this.createCollection({ name: "Coffee & Food Spots", icon: "coffee", color: "orange" });
    this.createCollection({ name: "Project Ideas", icon: "lightbulb", color: "purple" });
    this.createCollection({ name: "Reading List", icon: "book", color: "green" });
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: new Date(),
      aiEnhanced: false,
      audioUrl: null,
      transcription: null,
      aiSuggestion: null,
      collectionId: null,
    };
    this.notes.set(id, note);
    return note;
  }

  async getNotes(): Promise<NoteWithTodos[]> {
    const allNotes = Array.from(this.notes.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(allNotes.map(async note => {
      const noteTodos = await this.getTodosByNoteId(note.id);
      const collection = note.collectionId ? await this.getCollection(note.collectionId) : undefined;
      return { ...note, todos: noteTodos, collection };
    }));
  }

  async getNote(id: number): Promise<NoteWithTodos | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const noteTodos = await this.getTodosByNoteId(id);
    const collection = note.collectionId ? await this.getCollection(note.collectionId) : undefined;
    return { ...note, todos: noteTodos, collection };
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) throw new Error("Note not found");
    
    const updatedNote = { ...note, ...updates };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const id = this.currentTodoId++;
    const todo: Todo = { 
      ...insertTodo, 
      id, 
      createdAt: new Date(),
      completed: false,
    };
    this.todos.set(id, todo);
    return todo;
  }

  async getTodos(): Promise<Todo[]> {
    return Array.from(this.todos.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTodosByNoteId(noteId: number): Promise<Todo[]> {
    return Array.from(this.todos.values())
      .filter(todo => todo.noteId === noteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo> {
    const todo = this.todos.get(id);
    if (!todo) throw new Error("Todo not found");
    
    const updatedTodo = { ...todo, ...updates };
    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const collection: Collection = { 
      ...insertCollection, 
      id, 
      createdAt: new Date(),
    };
    this.collections.set(id, collection);
    return collection;
  }

  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async getNotesByCollectionId(collectionId: number): Promise<NoteWithTodos[]> {
    const collectionNotes = Array.from(this.notes.values())
      .filter(note => note.collectionId === collectionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(collectionNotes.map(async note => {
      const noteTodos = await this.getTodosByNoteId(note.id);
      const collection = await this.getCollection(collectionId);
      return { ...note, todos: noteTodos, collection };
    }));
  }
}

export const storage = new MemStorage();
