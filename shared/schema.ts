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
  transcription: text("transcription"),
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiSuggestion: text("ai_suggestion"),
  aiContext: text("ai_context"),
  richContext: text("rich_context"), // JSON string containing Google-style organized information
  collectionId: integer("collection_id").references(() => collections.id),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  pinned: boolean("pinned").default(false),
  archived: boolean("archived").default(false),
  priority: text("priority").default("normal"), // "urgent", "normal", "low"
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("folder"),
  color: text("color").default("blue"),
  iconUrl: text("icon_url"), // Custom icon image URL
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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
}));

export type NoteWithTodos = Note & {
  todos: Todo[];
  collection?: Collection;
};
