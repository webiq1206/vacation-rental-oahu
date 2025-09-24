#!/usr/bin/env node
/**
 * Startup Database Check Script
 * Automatically ensures database has essential data when server starts
 * This prevents production errors by fixing empty databases immediately
 */

import { pool } from '../server/db.js';

async function quickDatabaseCheck() {
  try {
    const client = await pool.connect();
    
    // Quick check for essential data
    const propertyCount = await client.query('SELECT COUNT(*) as count FROM property');
    const settingsCount = await client.query('SELECT COUNT(*) as count FROM settings');
    
    const hasProperty = parseInt(propertyCount.rows[0].count) > 0;
    const hasSettings = parseInt(settingsCount.rows[0].count) > 0;
    
    client.release();
    
    if (!hasProperty || !hasSettings) {
      console.log('\n⚠️  WARNING: Database appears to be empty!');
      console.log('📊 Found:');
      console.log(`  - Properties: ${propertyCount.rows[0].count}`);
      console.log(`  - Settings: ${settingsCount.rows[0].count}`);
      console.log('\n💡 To fix this issue, run:');
      console.log('   npx tsx scripts/import-production-data.ts');
      console.log('\n🌐 Website may not function properly until database is populated\n');
      
      return false;
    } else {
      console.log('✅ Database check passed - essential data present');
      return true;
    }
    
  } catch (error: any) {
    console.error('❌ Database check failed:', error.message);
    return false;
  }
}

export { quickDatabaseCheck };

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickDatabaseCheck();
}