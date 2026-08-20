import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth uid
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('auditor'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'forensic_audits' table for storing durable relational audit histories
export const forensicAudits = pgTable('forensic_audits', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Links to users.uid
  documentName: text('document_name').notNull(),
  documentType: text('document_type').notNull(),
  riskScore: integer('risk_score').notNull(),
  riskLevel: text('risk_level').notNull(),
  summary: text('summary').notNull(),
  discrepancies: jsonb('discrepancies'),
  forensicSignals: jsonb('forensic_signals'),
  recommendations: jsonb('recommendations'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'tasks_sync' table for tracking synced Google Tasks
export const tasksSync = pgTable('tasks_sync', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  taskId: text('task_id').notNull(),
  taskListId: text('task_list_id').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  status: text('status').default('needsAction'),
  due: text('due'),
  isAudited: boolean('is_audited').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  audits: many(forensicAudits),
  tasks: many(tasksSync),
}));

export const forensicAuditsRelations = relations(forensicAudits, ({ one }) => ({
  user: one(users, {
    fields: [forensicAudits.userId],
    references: [users.uid],
  }),
}));

export const tasksSyncRelations = relations(tasksSync, ({ one }) => ({
  user: one(users, {
    fields: [tasksSync.userId],
    references: [users.uid],
  }),
}));
