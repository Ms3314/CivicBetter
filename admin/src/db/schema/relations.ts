import { relations } from 'drizzle-orm';
import { users } from './users';
import { issues } from './issues';

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  createdIssues: many(issues, { relationName: 'issue_creator' }),
  assignedIssues: many(issues, { relationName: 'issue_assignee' }),
}));

// Issues relations
export const issuesRelations = relations(issues, ({ one }) => ({
  creator: one(users, {
    fields: [issues.createdBy],
    references: [users.id],
    relationName: 'issue_creator',
  }),
  assignee: one(users, {
    fields: [issues.assignedTo],
    references: [users.id],
    relationName: 'issue_assignee',
  }),
}));

