import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey(), idempotencyKey: text('idempotency_key').notNull().unique(),
  requestHash: text('request_hash').notNull(), createdAt: text('created_at').notNull(),
  status: text('status').notNull(), payload: text('payload').notNull(),
});
export const subscriptions = sqliteTable('push_subscriptions', {
  endpoint: text('endpoint').primaryKey(), userId: text('user_id').notNull(),
  payload: text('payload').notNull(), createdAt: text('created_at').notNull(),
});
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(), count: integer('count').notNull(), windowStart: integer('window_start').notNull(),
});
export const pushJobs = sqliteTable('push_jobs', {
  id: text('id').primaryKey(), payload: text('payload').notNull(),
  attempts: integer('attempts').notNull().default(0), nextAttempt: integer('next_attempt').notNull().default(0),
  sentAt: text('sent_at'),
});
