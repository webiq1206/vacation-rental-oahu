# Production Deployment Guide

## Overview
These scripts ensure your production site has all the data and functionality from your development environment when you republish.

## Quick Deployment Commands

### Manual Commands
```bash
# Export current development data
npx tsx scripts/export-production-data.ts

# Import data to production (run this after republishing)
npx tsx scripts/import-production-data.ts

# Complete deployment process
npx tsx scripts/deploy-production.ts
```

### What Gets Exported/Imported

✅ **Essential Production Data:**
- Property information and settings
- All amenities and categories  
- Photo gallery and images
- Site settings and configurations
- Email templates
- Content blocks and layouts
- Pricing rules
- Nearby attractions
- Admin user accounts

❌ **Excluded (Development/Sensitive Data):**
- Guest bookings and personal data
- Chat messages and audit logs
- External sync data
- Payment transaction logs

## Before Republishing

1. **Export your data:**
   ```bash
   npx tsx scripts/export-production-data.ts
   ```

2. **Verify export:** Check `scripts/production-data/latest.json` was created

## After Republishing

1. **Import your data:**
   ```bash
   npx tsx scripts/import-production-data.ts
   ```

2. **Verify deployment:** Your live site should now be fully functional

## Automatic Process

Run the complete deployment:
```bash
npx tsx scripts/deploy-production.ts
```

This handles everything automatically:
- Exports development data
- Builds the application
- Syncs database schema
- Imports production data
- Verifies deployment

## Troubleshooting

If the live site is missing data after republishing:
1. Check if `scripts/production-data/latest.json` exists
2. Run `npx tsx scripts/import-production-data.ts` manually
3. Check the console for any error messages
4. Ensure database connection is working

## Files Created

- `scripts/production-data/latest.json` - Latest data export
- `scripts/production-data/production-export-[timestamp].json` - Timestamped backups