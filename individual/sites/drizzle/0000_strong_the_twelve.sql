CREATE TABLE `activity_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`trials_json` text NOT NULL,
	`revision` integer NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `access_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `program_documents` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`answer` text,
	`created_at` text NOT NULL,
	`answered_at` text,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`published_at` text NOT NULL,
	`created_by` text NOT NULL
);
