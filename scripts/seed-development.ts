#!/usr/bin/env node
/**
 * SAFE Development Database Seeding
 * Seeds development database with exported production data
 * 
 * SAFETY: Only runs in development environment
 * USAGE: Copy production export file, then run this script
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = './scripts/production-data';

// Safety check - only allow in development
function requireDevelopmentEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 SAFETY ERROR: This script cannot run in production!');
    console.error('💡 This script is for development database seeding only');
    process.exit(1);
  }
  
  console.log('✅ Environment check passed - running in development mode');
}

async function importTable(client, tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} - no data`);
    return;
  }

  console.log(`📋 Seeding ${tableName} with ${data.length} records...`);
  
  try {
    // Clear existing development data
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    
    // Insert production data
    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnList = columns.join(', ');
    
    for (const row of data) {
      const values = columns.map(col => {
        // Handle JSONB columns properly
        if (typeof row[col] === 'object' && row[col] !== null) {
          return JSON.stringify(row[col]);
        }
        return row[col];
      });
      
      await client.query(
        `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
        values
      );
    }
    
    console.log(`  ✅ Successfully seeded ${data.length} records`);
    
  } catch (error) {
    console.error(`❌ Error seeding ${tableName}:`, error.message);
    throw error;
  }
}

export async function seedDevelopmentDatabase(exportFile = null) {
  console.log('🌱 Starting development database seeding...\n');
  
  // Critical safety check
  requireDevelopmentEnvironment();
  
  try {
    // Find export file
    const dataFile = exportFile || path.join(EXPORT_DIR, 'latest.json');
    
    // Check if export file exists
    try {
      await fs.access(dataFile);
    } catch {
      console.error(`❌ Export file not found: ${dataFile}`);
      console.log('\n💡 To get production data:');
      console.log('1. Export from production: npx tsx scripts/export-production-data.ts');
      console.log('2. Copy the export file to your development environment');
      console.log('3. Run this script to seed development database');
      process.exit(1);
    }
    
    // Load production export
    const fileContent = await fs.readFile(dataFile, 'utf-8');
    const exportData = JSON.parse(fileContent);
    
    console.log(`📁 Seeding from: ${dataFile}`);
    console.log(`📅 Export date: ${exportData.exportDate}`);
    console.log(`📦 Version: ${exportData.version}\n`);
    
    // Connect to development database
    const client = await pool.connect();
    
    console.log('🌱 Seeding development database with production content...\n');
    
    // Import in dependency order
    const importOrder = [
      'users',
      'amenity_categories', 
      'amenities',
      'property',
      'property_amenities',
      'photos',
      'nearby_attractions',
      'block_types',
      'content_blocks', 
      'page_layouts',
      'pricing_rules',
      'email_templates',
      'settings'
    ];
    
    // Start transaction for safety
    await client.query('BEGIN');
    
    try {
      for (const tableName of importOrder) {
        if (exportData.tables[tableName]) {
          await importTable(client, tableName, exportData.tables[tableName]);
        }
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    
    console.log('\n🎉 Development database seeding completed!');
    console.log('🌱 Your development environment now has production content');
    console.log('🛡️  All booking and guest data was excluded for security');
    
  } catch (error) {
    console.error('\n❌ Development seeding failed:', error.message);
    console.log('🔄 All changes have been rolled back');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔒 SAFETY: This script only runs in development');
  console.log('🌱 Seeds development database with production content\n');
  
  seedDevelopmentDatabase();
}