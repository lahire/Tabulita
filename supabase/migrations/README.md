# Database Migrations

This directory contains SQL migrations for the Tabulita database schema.

## Migration Files

Migrations are numbered and should be run in order:

1. **20260304000001_initial_schema.sql** - Creates all core tables
2. **20260304000002_rls_policies.sql** - Sets up Row Level Security policies
3. **20260304000003_functions_triggers.sql** - Creates database functions and triggers

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file **in order**
4. Click **Run** for each migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Option 3: Manual SQL Execution

You can also connect to your Supabase database using any PostgreSQL client and run the migrations manually.

## Verification

After running all migrations, verify the setup:

```sql
-- Check that all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

## Rolling Back

If you need to roll back migrations:

```sql
-- Drop all tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS item_matches CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS league_members CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS notify_item_match CASCADE;
DROP FUNCTION IF EXISTS update_wishlist_on_match_status CASCADE;
DROP FUNCTION IF EXISTS auto_add_league_creator CASCADE;
DROP FUNCTION IF EXISTS get_user_leagues CASCADE;
DROP FUNCTION IF EXISTS get_league_wishlist_summary CASCADE;
```

## Schema Documentation

For detailed documentation of the database schema, see:
- [Database Schema Documentation](../../docs/database-schema.md)
- TypeScript types: `src/types/database.ts`

## Important Notes

- **RLS is enabled**: Make sure you understand the Row Level Security policies before querying data
- **Auth integration**: The `profiles` table is automatically populated when users sign up via Supabase Auth
- **Triggers**: Several triggers automatically update timestamps and create notifications
- **Foreign keys**: All relationships use foreign keys with appropriate CASCADE behaviors
