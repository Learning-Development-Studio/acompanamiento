import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const activityRuns=sqliteTable('activity_runs',{id:text('id').primaryKey(),taskId:text('task_id').notNull(),trialsJson:text('trials_json').notNull(),revision:integer('revision').notNull(),completedAt:text('completed_at'),updatedAt:text('updated_at').notNull(),createdBy:text('created_by').notNull()});
export const documents=sqliteTable('program_documents',{key:text('key').primaryKey(),valueJson:text('value_json').notNull(),updatedAt:text('updated_at').notNull()});
export const reports=sqliteTable('family_reports',{id:text('id').primaryKey(),payloadJson:text('payload_json').notNull(),publishedAt:text('published_at').notNull(),createdBy:text('created_by').notNull()});
export const questions=sqliteTable('family_questions',{id:text('id').primaryKey(),kind:text('kind').notNull(),message:text('message').notNull(),answer:text('answer'),createdAt:text('created_at').notNull(),answeredAt:text('answered_at'),createdBy:text('created_by').notNull()});
export const attempts=sqliteTable('access_attempts',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),createdAt:text('created_at').notNull()});
