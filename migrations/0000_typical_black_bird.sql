CREATE TABLE "collection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer,
	"source_note_id" integer,
	"raw_text" text,
	"normalised_json" json,
	"position" integer DEFAULT 0,
	"completed" boolean DEFAULT false,
	"intelligence_rating" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'folder',
	"color" text DEFAULT 'blue',
	"icon_url" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"collection_type" text DEFAULT 'standard',
	"smart_filters" json,
	"intelligence_metadata" json
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"context" text,
	"detailed_content" text,
	"source_note_id" integer,
	"collection_id" integer,
	"is_processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"change_type" text NOT NULL,
	"change_description" text,
	"changed_by" text DEFAULT 'user',
	"preserved_sections" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confidence" integer,
	"user_approved" boolean,
	"risk_level" text DEFAULT 'low'
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"mode" text NOT NULL,
	"user_id" varchar,
	"is_shared" boolean DEFAULT false,
	"share_id" varchar,
	"privacy_level" text DEFAULT 'private',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"audio_url" text,
	"media_url" text,
	"transcription" text,
	"image_data" text,
	"ai_enhanced" boolean DEFAULT false,
	"ai_suggestion" text,
	"ai_context" text,
	"rich_context" text,
	"is_processing" boolean DEFAULT false,
	"collection_id" integer,
	"vector_dense" text,
	"vector_sparse" text,
	"intent_vector" json,
	"version" integer DEFAULT 1 NOT NULL,
	"original_content" text,
	"last_user_edit" timestamp DEFAULT now(),
	"protected_content" json,
	"processing_path" text,
	"classification_scores" json
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reminder_time" timestamp NOT NULL,
	"is_completed" boolean DEFAULT false,
	"todo_id" integer,
	"note_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false,
	"pinned" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"priority" text DEFAULT 'normal',
	"item_type" text DEFAULT 'todo',
	"time_due" timestamp,
	"time_dependency" text,
	"depends_on_todo_ids" json,
	"triggers_todo_ids" json,
	"planned_notification_structure" json DEFAULT '{"enabled":false,"reminderCategory":"not_set","repeatPattern":"none","leadTimeNotifications":[]}'::json,
	"is_active_reminder" boolean DEFAULT false,
	"last_notification_sent" timestamp,
	"next_notification_due" timestamp,
	"reminder_state" varchar DEFAULT 'active',
	"archived_at" timestamp,
	"dismissed_at" timestamp,
	"due_date" timestamp,
	"recurrence_rule" text,
	"note_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone_number" varchar,
	"personal_bio" text,
	"preferences" json,
	"reminder_settings" json DEFAULT '{"defaultLeadTimes":{"general":10,"pickup":10,"appointment":30,"medication":0,"call":5,"meeting":15,"flight":120},"autoArchiveAfterDays":1,"showOverdueReminders":true,"enablePushNotifications":true}'::json,
	"developer_settings" json DEFAULT '{"enableDualAIProcessing":false,"showAIComparison":false,"debugMode":false}'::json,
	"onboarding_completed" boolean DEFAULT false,
	"privacy_settings" json DEFAULT '{"includePrivateDataInSharedNotes":false,"allowContactDiscovery":true,"defaultNotePrivacy":"private"}'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_source_note_id_notes_id_fk" FOREIGN KEY ("source_note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_source_note_id_notes_id_fk" FOREIGN KEY ("source_note_id") REFERENCES "public"."notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_versions" ADD CONSTRAINT "note_versions_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");