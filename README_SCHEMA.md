# Task Manager Database Schema

## Overview
This document describes the database schema for the Task Manager application built with Supabase.

## Tables

### 1. Users Table
Extends Supabase's built-in `auth.users` table with additional profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| email | TEXT | User's email address (unique) |
| full_name | TEXT | User's display name |
| avatar_url | TEXT | URL to user's profile picture |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last profile update timestamp |

### 2. Categories Table
Allows users to organize tasks into custom categories.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| name | TEXT | Category name (unique per user) |
| color | TEXT | Hex color code for UI display |
| description | TEXT | Optional category description |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### 3. Tasks Table
The main table for storing task information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| category_id | UUID | Foreign key to categories table (nullable) |
| title | TEXT | Task title (required) |
| description | TEXT | Detailed task description |
| status | task_status | Current status (enum) |
| priority | task_priority | Task priority level (enum) |
| due_date | TIMESTAMPTZ | Optional due date |
| completed_at | TIMESTAMPTZ | Auto-set when status becomes 'completed' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Enums

### task_status
- `todo` - Task not started
- `in_progress` - Task currently being worked on
- `completed` - Task finished
- `cancelled` - Task cancelled/abandoned

### task_priority
- `low` - Low priority
- `medium` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

## Relationships

- **Users → Categories**: One-to-many (user can have multiple categories)
- **Users → Tasks**: One-to-many (user can have multiple tasks)
- **Categories → Tasks**: One-to-many (category can contain multiple tasks)

## Security (Row Level Security)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- All CRUD operations are restricted to the authenticated user's records
- No cross-user data access is possible

## Features

### Automatic Timestamps
- All tables have `created_at` and `updated_at` columns
- `updated_at` is automatically updated on row changes
- `completed_at` is automatically set when task status changes to 'completed'

### Default Categories
When a new user is created, default categories are automatically created:
- Personal (blue)
- Work (pink)
- Shopping (light blue)
- Health (green)

### Performance Indexes
Indexes are created on frequently queried columns:
- `tasks.user_id`
- `tasks.status`
- `tasks.priority`
- `tasks.due_date`
- `tasks.category_id`
- `categories.user_id`

## Usage

Run the migration in your Supabase project:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/001_create_task_manager_schema.sql`

The TypeScript types are available in `src/types/database.ts` for type-safe database operations.