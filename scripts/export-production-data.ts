#!/usr/bin/env node
/**
 * Production Data Export Script
 * Exports all essential data needed for a fully functional production site
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = './scripts/production-data';

// Essential tables for site functionality
const ESSENTIAL_TABLES = [
  'property',
  'amenities', 
  'amenity_categories',
  'property_amenities',
  'photos',
  'nearby_attractions',
  'settings',
  'email_templates',
  'block_types',
  'content_blocks',
  'page_layouts',
  'pricing_rules',
  'users'  // Admin users only
];

// Tables with sensitive data to exclude from export
const EXCLUDE_TABLES = [
  'bookings',
  'guests', 
  'guest_reviews',
  'airbnb_reviews',
  'messages',
  'chat_messages',
  'audit_logs',
  'email_events',
  'sync_runs',
  'external_reservations',
  'holds',
  'blackout_dates'
];

async function exportTable(client, tableName) {
  console.log(`Exporting ${tableName}...`);
  
  try {
    let query = `SELECT * FROM ${tableName}`;
    
    // Special handling for sensitive tables
    if (tableName === 'users') {
      // Only export admin users, not guest data
      query = `SELECT * FROM ${tableName} WHERE role = 'admin' OR email LIKE '%admin%'`;
    }
    
    const result = await client.query(query);
    const rows = result.rows || [];
    
    console.log(`  → Exported ${rows.length} records from ${tableName}`);
    return rows;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function exportProductionData() {
  console.log('🚀 Starting production data export...\n');
  
  try {
    // Ensure export directory exists
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    // Connect to database using pool
    const client = await pool.connect();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      tables: {}
    };
    
    // Export each essential table
    for (const tableName of ESSENTIAL_TABLES) {
      const data = await exportTable(client, tableName);
      exportData.tables[tableName] = data;
    }
    
    // Save export data
    const exportFile = path.join(EXPORT_DIR, `production-export-${Date.now()}.json`);
    await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
    
    // Also save as latest.json for easy access
    const latestFile = path.join(EXPORT_DIR, 'latest.json');
    await fs.writeFile(latestFile, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Production data exported successfully!`);
    console.log(`📁 Export file: ${exportFile}`);
    console.log(`📁 Latest file: ${latestFile}`);
    
    // Generate summary
    const summary = Object.entries(exportData.tables)
      .map(([table, data]) => `  ${table}: ${(data as any[]).length} records`)
      .join('\n');
    
    console.log(`\n📊 Export Summary:\n${summary}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportProductionData();
}

export { exportProductionData };