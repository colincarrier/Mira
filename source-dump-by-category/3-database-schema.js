// ==========================================
// MIRA AI - DATABASE SCHEMA
// ==========================================

// DATABASE SCHEMA (shared/schema.ts)
import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// NOTES TABLE - Core content storage
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  aiGeneratedTitle: text("ai_generated_title"),
  mode: text("mode").notNull(), // 'text', 'voice', 'image'
  userId: varchar("user_id").references(() => users.id),
  isShared: boolean("is_shared").default(false),
  shareId: varchar("share_id"),
  privacyLevel: text("privacy_level").default("private"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  audioUrl: text("audio_url"),
  mediaUrl: text("media_url"),
  transcription: text("transcription"),
  imageData: text("image_data"),
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiSuggestion: text("ai_suggestion"),
  aiContext: text("ai_context"),
  richContext: text("rich_context"), // JSON string containing V2 analysis
  isProcessing: boolean("is_processing").default(false),
  collectionId: integer("collection_id").references(() => collections.id),
  
  // Intelligence-v2: Vector storage for semantic search
  vectorDense: text("vector_dense"), // Dense vector embedding
  vectorSparse: text("vector_sparse"), // Sparse vector as JSON
  intentVector: json("intent_vector").$type<{
    categories: Record<string, number>;
    confidence: number;
    reasoning: string;
  }>(),
  
  // Version control and data protection
  version: integer("version").default(1).notNull(),
  originalContent: text("original_content"),
  lastUserEdit: timestamp("last_user_edit").defaultNow(),
  protectedContent: json("protected_content").$type<{
    userSections: string[];
    manualEdits: { timestamp: Date; content: string; }[];
    aiModifications: { timestamp: Date; type: string; description: string; }[];
  }>(),
  
  // AI processing metadata
  processingPath: text("processing_path"), // 'commerce' | 'memory'
  classificationScores: json("classification_scores").$type<Record<string, number>>(),
});

// USERS TABLE - User profiles and preferences
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  personalBio: text("personal_bio"), // CRITICAL: User context for AI personalization
  preferences: json("preferences"),
  reminderSettings: json("reminder_settings").$type<{
    defaultLeadTimes: {
      general: number;
      pickup: number;
      appointment: number;
      medication: number;
      call: number;
      meeting: number;
      flight: number;
    };
    autoArchiveAfterDays: number;
    showOverdueReminders: boolean;
    enablePushNotifications: boolean;
  }>().default({
    defaultLeadTimes: {
      general: 10,
      pickup: 10,
      appointment: 30,
      medication: 0,
      call: 5,
      meeting: 15,
      flight: 120
    },
    autoArchiveAfterDays: 1,
    showOverdueReminders: true,
    enablePushNotifications: true
  }),
  developerSettings: json("developer_settings").default({
    enableDualAIProcessing: false,
    showAIComparison: false,
    debugMode: false
  }),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  privacySettings: json("privacy_settings").default({
    includePrivateDataInSharedNotes: false,
    allowContactDiscovery: true,
    defaultNotePrivacy: "private"
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TODOS TABLE - Task management
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  pinned: boolean("pinned").default(false),
  archived: boolean("archived").default(false),
  priority: text("priority").default("normal"),
  
  // Enhanced time-sensitivity and reminder classification
  itemType: text("item_type").default("todo"),
  timeDue: timestamp("time_due"),
  timeDependency: text("time_dependency"),
  dependsOnTodoIds: json("depends_on_todo_ids").$type<number[]>(),
  triggersTodoIds: json("triggers_todo_ids").$type<number[]>(),
  
  // Sophisticated notification structure
  plannedNotificationStructure: json("planned_notification_structure").$type<{
    enabled: boolean;
    reminderCategory: "today" | "week" | "month" | "year" | "not_set";
    repeatPattern: "none" | "hourly" | "daily" | "weekly" | "monthly" | "annual";
    leadTimeNotifications: string[];
    customSchedule?: {
      times: string[];
      daysOfWeek?: number[];
      dayOfMonth?: number;
      monthOfYear?: number;
    };
  }>().default({
    enabled: false,
    reminderCategory: "not_set",
    repeatPattern: "none",
    leadTimeNotifications: []
  }),
  
  // Enhanced reminder metadata
  isActiveReminder: boolean("is_active_reminder").default(false),
  lastNotificationSent: timestamp("last_notification_sent"),
  nextNotificationDue: timestamp("next_notification_due"),
  
  // Reminder state management
  reminderState: varchar("reminder_state").default("active"),
  archivedAt: timestamp("archived_at"),
  dismissedAt: timestamp("dismissed_at"),
  dueDate: timestamp("due_date"),
  recurrenceRule: text("recurrence_rule"),
  
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// COLLECTIONS TABLE - Organization system
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("folder"),
  color: text("color").default("blue"),
  iconUrl: text("icon_url"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Intelligence-v2: Enhanced collection metadata
  collectionType: text("collection_type").default("standard"),
  smartFilters: json("smart_filters").$type<{
    tags?: string[];
    contentTypes?: string[];
    dateRange?: { start: Date; end: Date };
    priority?: string[];
    autoInclude?: boolean;
  }>(),
  intelligenceMetadata: json("intelligence_metadata").$type<{
    patterns: Record<string, number>;
    relationships: string[];
    userBehavior: Record<string, any>;
    predictiveScore: number;
  }>(),
});

// ITEMS TABLE - Extracted entities
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'book', 'movie', 'restaurant', 'product', etc.
  description: text("description"),
  context: text("context"),
  detailedContent: text("detailed_content"),
  sourceNoteId: integer("source_note_id").references(() => notes.id),
  collectionId: integer("collection_id").references(() => collections.id),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// REMINDERS TABLE - Time-based notifications
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reminderTime: timestamp("reminder_time").notNull(),
  isCompleted: boolean("is_completed").default(false),
  todoId: integer("todo_id").references(() => todos.id, { onDelete: 'cascade' }),
  noteId: integer("note_id").references(() => notes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NOTE VERSIONS TABLE - Version control
export const noteVersions = pgTable("note_versions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changeType: text("change_type").notNull(),
  changeDescription: text("change_description"),
  changedBy: text("changed_by").default("user"),
  preservedSections: json("preserved_sections").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confidence: integer("confidence"),
  userApproved: boolean("user_approved"),
  riskLevel: text("risk_level").default("low"),
});

// COLLECTION ITEMS TABLE - Smart organization
export const collectionItems = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id, { onDelete: 'cascade' }),
  sourceNoteId: integer("source_note_id").references(() => notes.id, { onDelete: 'cascade' }),
  rawText: text("raw_text"),
  normalisedJson: json("normalised_json").$type<{
    extractedEntities: Record<string, any>[];
    processedContent: string;
    intelligenceScore: number;
    relationships: string[];
  }>(),
  position: integer("position").default(0),
  completed: boolean("completed").default(false),
  intelligenceRating: integer("intelligence_rating").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SESSIONS TABLE - Authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// SCHEMA EXPORTS
export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// TYPE EXPORTS
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertNoteVersion = typeof noteVersions.$inferInsert;
export type NoteVersion = typeof noteVersions.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// RELATIONS
export const notesRelations = relations(notes, ({ one, many }) => ({
  collection: one(collections, {
    fields: [notes.collectionId],
    references: [collections.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  todos: many(todos),
  items: many(items),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  note: one(notes, {
    fields: [todos.noteId],
    references: [notes.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  notes: many(notes),
  items: many(items),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  todo: one(todos, {
    fields: [reminders.todoId],
    references: [todos.id],
  }),
  note: one(notes, {
    fields: [reminders.noteId],
    references: [notes.id],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  sourceNote: one(notes, {
    fields: [items.sourceNoteId],
    references: [notes.id],
  }),
  collection: one(collections, {
    fields: [items.collectionId],
    references: [collections.id],
  }),
}));

export type NoteWithTodos = Note & {
  todos: Todo[];
  collection?: Collection;
  items?: Item[];
};