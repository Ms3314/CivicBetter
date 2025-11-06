import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const issueStatusEnum = pgEnum('issue_status', [
  'pending',
  'assigned',
  'accepted',
  'in-progress',
  'completed',
  'rejected',
]);

export const issues = pgTable('issues', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  photo: text('photo'), // URL to photo
  location: text('location').notNull(), // Can be JSON string or address
  status: issueStatusEnum('status').notNull().default('pending'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  assignedTo: text('assigned_to').references(() => users.id), // Worker ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;

