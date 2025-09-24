# Database Migration Status
Generated: 2025-09-24T21:02:31.693Z

## Applied Migrations (1)
- ✅ 20250924210009 - initial_schema (Wed Sep 24 2025 21:01:09 GMT+0000 (Coordinated Universal Time))

## Pending Migrations (0)


## Migration Commands
```bash
# Run pending migrations
npx tsx scripts/db-migrations/migration-manager.ts migrate

# Create new migration
npx tsx scripts/db-migrations/migration-manager.ts create "migration_name" "Description"

# Rollback last migration
npx tsx scripts/db-migrations/migration-manager.ts rollback

# Sync migrations to GitHub
npx tsx scripts/db-migrations/migration-manager.ts sync
```
