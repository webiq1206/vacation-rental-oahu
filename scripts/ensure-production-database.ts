#!/usr/bin/env node
/**
 * Production Database Verification & Fix Script
 * Ensures production environment uses the same database as development
 * Automatically populates production database if empty
 */

import { pool } from '../server/db.js';
import { importProductionData } from './import-production-data.js';

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');
  
  try {
    const client = await pool.connect();
    
    // Check critical tables
    const propertyCheck = await client.query('SELECT COUNT(*) as count FROM property');
    const amenitiesCheck = await client.query('SELECT COUNT(*) as count FROM amenities');
    const photosCheck = await client.query('SELECT COUNT(*) as count FROM photos');
    const settingsCheck = await client.query('SELECT COUNT(*) as count FROM settings');
    const pricingCheck = await client.query('SELECT COUNT(*) as count FROM pricing_rules');
    
    const counts = {
      property: parseInt(propertyCheck.rows[0].count),
      amenities: parseInt(amenitiesCheck.rows[0].count),
      photos: parseInt(photosCheck.rows[0].count),
      settings: parseInt(settingsCheck.rows[0].count),
      pricing_rules: parseInt(pricingCheck.rows[0].count)
    };
    
    console.log('📊 Database Status:');
    console.log(`  Property: ${counts.property}`);
    console.log(`  Amenities: ${counts.amenities}`);
    console.log(`  Photos: ${counts.photos}`);
    console.log(`  Settings: ${counts.settings}`);
    console.log(`  Pricing Rules: ${counts.pricing_rules}\n`);
    
    // Check if database is empty (missing critical data)
    const isEmpty = counts.property === 0 || counts.amenities === 0 || counts.settings === 0;
    
    client.release();
    
    return { counts, isEmpty };
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return { counts: null, isEmpty: true };
  }
}

async function fixProductionDatabase() {
  console.log('🚀 Ensuring production database is properly configured...\n');
  
  const { counts, isEmpty } = await checkDatabaseStatus();
  
  if (isEmpty) {
    console.log('⚠️  Database is empty or missing critical data!');
    console.log('📥 Importing essential data...\n');
    
    // Import the data
    await importProductionData();
    
    // Verify the fix
    console.log('\n✅ Verifying database after import...');
    const { counts: newCounts, isEmpty: stillEmpty } = await checkDatabaseStatus();
    
    if (stillEmpty) {
      console.error('❌ Database import failed - production site may not work correctly');
      process.exit(1);
    } else {
      console.log('✅ Database successfully populated!');
      console.log('🌐 Production site should now be fully functional');
    }
  } else {
    console.log('✅ Database is properly configured with all essential data');
    console.log('🌐 Production site should be working correctly');
  }
}

// Run the fix if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixProductionDatabase().catch(console.error);
}

export { fixProductionDatabase, checkDatabaseStatus };