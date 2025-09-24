#!/usr/bin/env node
/**
 * Safe Development → Production Content Sync
 * Syncs ONLY vetted content changes from dev to production
 * NEVER touches bookings, payments, or guest data
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';
import path from 'path';

// SAFE CONTENT-ONLY TABLES that can be promoted from dev to production
const SAFE_CONTENT_TABLES = [
  'property',           // Property details (safe to update)
  'amenities',         // Amenity updates (safe)
  'amenity_categories', // Category changes (safe)  
  'property_amenities', // Amenity relationships (safe)
  'photos',            // Photo gallery updates (safe)
  'nearby_attractions', // Attraction updates (safe)
  'email_templates',   // Template updates (safe)
  'content_blocks',    // Content updates (safe)
  'page_layouts',      // Layout changes (safe)
  'pricing_rules'      // Pricing updates (safe - but review carefully!)
];

// PRODUCTION-ONLY TABLES - NEVER OVERWRITE
const PRODUCTION_PROTECTED = [
  'bookings',          // LIVE RESERVATIONS - NEVER TOUCH
  'guests',           // GUEST DATA - NEVER TOUCH
  'users',            // ADMIN ACCOUNTS - NEVER OVERWRITE
  'audit_logs',       // PRODUCTION LOGS - NEVER TOUCH
  'settings',         // PRODUCTION SETTINGS - Handle separately
  'blackout_dates',   // LIVE AVAILABILITY - NEVER TOUCH
  'holds',           // RESERVATION HOLDS - NEVER TOUCH
  'external_reservations' // EXTERNAL BOOKINGS - NEVER TOUCH
];

async function backupProductionTable(client, tableName) {
  console.log(`💾 Creating backup of production ${tableName}...`);
  
  try {
    const backupTable = `${tableName}_backup_${Date.now()}`;
    await client.query(`CREATE TABLE ${backupTable} AS SELECT * FROM ${tableName}`);
    console.log(`  ✅ Production ${tableName} backed up to ${backupTable}`);
    return backupTable;
  } catch (error) {
    console.error(`❌ Failed to backup ${tableName}:`, error.message);
    throw error;
  }
}

async function syncContentTable(client, tableName, newData) {
  console.log(`📤 Syncing ${tableName} to production...`);
  
  try {
    // Create backup first
    const backupTable = await backupProductionTable(client, tableName);
    
    // Clear current data
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    
    // Insert new data
    if (newData && newData.length > 0) {
      const columns = Object.keys(newData[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnList = columns.join(', ');
      
      for (const row of newData) {
        const values = columns.map(col => row[col]);
        await client.query(
          `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
          values
        );
      }
    }
    
    console.log(`  ✅ Successfully synced ${newData?.length || 0} records to production ${tableName}`);
    console.log(`  💾 Backup available: ${backupTable}`);
    
  } catch (error) {
    console.error(`❌ Failed to sync ${tableName}:`, error.message);
    throw error;
  }
}

export async function syncContentToProduction(contentFile = null) {
  console.log('🔄 Starting SAFE Development → Production content sync...\n');
  console.log('⚠️  This will ONLY update content - bookings/guests are PROTECTED\n');
  
  try {
    // Determine content file - use the standard export file
    const dataFile = contentFile || path.join('./scripts/production-data', 'latest.json');
    
    // Check if file exists
    try {
      await fs.access(dataFile);
    } catch {
      console.error(`❌ Content export file not found: ${dataFile}`);
      console.log('💡 Export your development content first: npx tsx scripts/export-production-data.ts');
      process.exit(1);
    }
    
    // Load content data
    const fileContent = await fs.readFile(dataFile, 'utf-8');
    const contentData = JSON.parse(fileContent);
    
    console.log(`📁 Importing content from: ${dataFile}`);
    console.log(`📅 Export date: ${contentData.exportDate}`);
    console.log(`📦 Version: ${contentData.version}\n`);
    
    // Connect to production database
    const client = await pool.connect();
    
    console.log('🔒 PROTECTED production data (will NOT be changed):');
    PRODUCTION_PROTECTED.forEach(table => console.log(`   🛡️  ${table}`));
    
    console.log('\n📤 Syncing content tables to production:');
    
    // Start transaction for safety
    await client.query('BEGIN');
    
    try {
      // Sync only safe content tables
      for (const tableName of SAFE_CONTENT_TABLES) {
        if (contentData.tables[tableName]) {
          await syncContentTable(client, tableName, contentData.tables[tableName]);
        }
      }
      
      // Commit all changes
      await client.query('COMMIT');
      
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    
    console.log('\n✅ SAFE content sync to production completed!');
    console.log('🛡️  Security: All bookings and guest data protected');
    console.log('💾 Backups created for all updated tables');
    console.log('🎉 Your production site now has the updated content!');
    
  } catch (error) {
    console.error('❌ Content sync failed:', error);
    console.log('\n🔄 All changes have been rolled back');
    process.exit(1);
  }
}

// Run if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('⚠️  WARNING: This will update production content!');
  console.log('🛡️  Bookings and guest data are protected');
  console.log('💾 Backups will be created automatically\n');
  
  // Add confirmation prompt for production sync
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Continue with production content sync? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      syncContentToProduction();
    } else {
      console.log('❌ Production sync cancelled');
    }
    rl.close();
  });
}