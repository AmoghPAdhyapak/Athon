import { pgTable, text, serial, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedCaptionsTable = pgTable(
  "saved_captions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"), // Clerk userId; null for legacy rows
    text: text("text").notNull(),
    category: text("category").notNull(),
    type: text("type").notNull(),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
  },
  (t) => [index("saved_captions_user_idx").on(t.userId)],
);

export const generationHistoryTable = pgTable(
  "generation_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"), // Clerk userId; null for legacy rows
    category: text("category").notNull(),
    topic: text("topic").notNull(),
    type: text("type").notNull(),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    resultSnapshot: jsonb("result_snapshot").notNull(),
  },
  (t) => [index("generation_history_user_idx").on(t.userId)],
);

export const generatedImagesTable = pgTable(
  "generated_images",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"), // Clerk userId; null for legacy/anonymous rows
    isPublic: boolean("is_public").notNull().default(false),
    b64Data: text("b64_data").notNull(),
    mimeType: text("mime_type").notNull().default("image/png"),
    platform: text("platform").notNull(),
    mood: text("mood").notNull(),
    style: text("style").notNull(),
    game: text("game"),
    situation: text("situation"),
    extraPrompt: text("extra_prompt"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("generated_images_user_idx").on(t.userId),
    index("generated_images_public_idx").on(t.isPublic),
  ],
);

export const insertGeneratedImageSchema = createInsertSchema(generatedImagesTable).omit({ id: true, createdAt: true });
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImagesTable.$inferSelect;

export const insertSavedCaptionSchema = createInsertSchema(savedCaptionsTable).omit({ id: true, savedAt: true });
export type InsertSavedCaption = z.infer<typeof insertSavedCaptionSchema>;
export type SavedCaption = typeof savedCaptionsTable.$inferSelect;

export const insertGenerationHistorySchema = createInsertSchema(generationHistoryTable).omit({ id: true, generatedAt: true });
export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
export type GenerationHistory = typeof generationHistoryTable.$inferSelect;
