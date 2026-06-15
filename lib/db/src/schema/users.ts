import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * users — local mirror of Clerk identities, plus CreatorCore profile fields.
 * `id` is the Clerk userId (e.g. "user_xxx") — primary key, never recycled.
 */
export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk userId
    username: text("username").unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    email: text("email"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("users_username_idx").on(t.username)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscore only").optional(),
  displayName: z.string().max(64).optional(),
  bio: z.string().max(280).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
