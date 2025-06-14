import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  mode: text("mode").notNull(), // 'text', 'voice', 'image'
  userId: varchar("user_id").references(() => users.id),
  isShared: boolean("is_shared").default(false),
  shareId: varchar("share_id"), // For shareable links
  privacyLevel: text("privacy_level").default("private"), // 'private', 'shared', 'public'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  audioUrl: text("audio_url"),
  mediaUrl: text("media_url"), // URL to uploaded media files (images, documents, etc.)
  transcription: text("transcription"),
  imageData: text("image_data"), // Base64 encoded image data
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiSuggestion: text("ai_suggestion"),
  aiContext: text("ai_context"),
  richContext: text("rich_context"), // JSON string containing Google-style organized information
  isProcessing: boolean("is_processing").default(false), // True while AI is processing
  collectionId: integer("collection_id").references(() => collections.id),
  
  // Intelligence-v2: Vector storage for semantic search
  vectorDense: text("vector_dense"), // Dense vector embedding (3072 dimensions)
  vectorSparse: text("vector_sparse"), // Sparse vector for keyword matching
  intentVector: json("intent_vector").$type<{
    categories: Record<string, number>;
    confidence: number;
    reasoning: string;
  }>(),
  
  // Version control and data protection
  version: integer("version").default(1).notNull(),
  originalContent: text("original_content"), // Preserve original user input
  lastUserEdit: timestamp("last_user_edit").defaultNow(), // Track manual edits
  protectedContent: json("protected_content").$type<{
    userSections: string[]; // Content sections that should be preserved
    manualEdits: { timestamp: Date; content: string; }[];
    aiModifications: { timestamp: Date; type: string; description: string; }[];
  }>(),
  
  // Orthogonal AI upgrade metadata
  processingPath: text("processing_path"), // 'commerce' | 'memory'
  classificationScores: json("classification_scores").$type<Record<string, number>>(),
});

// Note versions for complete changelog and rollback capability
export const noteVersions = pgTable("note_versions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changeType: text("change_type").notNull(), // 'user_edit', 'ai_enhancement', 'ai_suggestion_applied', 'manual_rollback'
  changeDescription: text("change_description"), // Human-readable description of what changed
  changedBy: text("changed_by").default("user"), // 'user', 'ai_openai', 'ai_claude', 'system'
  preservedSections: json("preserved_sections").$type<string[]>(), // Content sections that were protected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata about the change
  confidence: integer("confidence"), // AI confidence level (1-100) for AI changes
  userApproved: boolean("user_approved"), // Whether user explicitly approved AI changes
  riskLevel: text("risk_level").default("low"), // 'low', 'medium', 'high' - based on content value analysis
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  pinned: boolean("pinned").default(false),
  archived: boolean("archived").default(false),
  priority: text("priority").default("normal"), // "urgent", "normal", "low"
  
  // Enhanced time-sensitivity and reminder classification
  itemType: text("item_type").default("todo"), // "todo", "reminder"
  timeDue: timestamp("time_due"), // Specific due date/time (nullable for "not set")
  timeDependency: text("time_dependency"), // "none", "sequential", "parallel", "contingent"
  dependsOnTodoIds: json("depends_on_todo_ids").$type<number[]>(), // Array of todo IDs this depends on
  triggersTodoIds: json("triggers_todo_ids").$type<number[]>(), // Array of todo IDs triggered by completion
  
  // Sophisticated notification structure
  plannedNotificationStructure: json("planned_notification_structure").$type<{
    enabled: boolean;
    reminderCategory: "today" | "week" | "month" | "year" | "not_set";
    repeatPattern: "none" | "hourly" | "daily" | "weekly" | "monthly" | "annual";
    leadTimeNotifications: string[]; // e.g., ["1 hour before", "1 day before"]
    customSchedule?: {
      times: string[]; // specific times for repeating reminders
      daysOfWeek?: number[]; // for weekly patterns
      dayOfMonth?: number; // for monthly patterns
      monthOfYear?: number; // for annual patterns
    };
  }>().default({
    enabled: false,
    reminderCategory: "not_set",
    repeatPattern: "none",
    leadTimeNotifications: []
  }),
  
  // Enhanced reminder metadata
  isActiveReminder: boolean("is_active_reminder").default(false), // Shows in Reminders section
  lastNotificationSent: timestamp("last_notification_sent"),
  nextNotificationDue: timestamp("next_notification_due"),
  
  // Reminder state management
  reminderState: varchar("reminder_state").default("active"), // 'active', 'overdue', 'completed', 'dismissed', 'archived'
  archivedAt: timestamp("archived_at"),
  dismissedAt: timestamp("dismissed_at"),
  dueDate: timestamp("due_date"), // When the reminder is actually due
  recurrenceRule: text("recurrence_rule"), // RRULE format for recurring reminders
  
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("folder"),
  color: text("color").default("blue"),
  iconUrl: text("icon_url"), // Custom icon image URL
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Intelligence-v2: Enhanced collection metadata
  collectionType: text("collection_type").default("standard"), // 'standard', 'smart', 'temporal', 'project'
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

// Intelligence-v2: Collection items for smart organization
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
  intelligenceRating: integer("intelligence_rating").default(0), // 0-100 quality score
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'book', 'movie', 'restaurant', 'product', 'place', 'person', 'concept'
  description: text("description"),
  context: text("context"), // Why this item was mentioned
  detailedContent: text("detailed_content"), // AI-generated detailed information
  sourceNoteId: integer("source_note_id").references(() => notes.id),
  collectionId: integer("collection_id").references(() => collections.id),
  isProcessed: boolean("is_processed").default(false), // Whether detailed content has been generated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"), // For future contact-based discovery
  personalBio: text("personal_bio"),
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

// Relations
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

// Additional type exports for new tables  
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
