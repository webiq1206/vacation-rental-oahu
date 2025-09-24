#!/usr/bin/env node
/**
 * Production Data Import Script
 * Imports essential data to make production site fully functional
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = './scripts/production-data';

async function importTable(client, tableName, data) {
  if (!data || data.length === 0) {
    console.log(`  → No data to import for ${tableName}`);
    return;
  }
  
  console.log(`Importing ${data.length} records to ${tableName}...`);
  
  try {
    // Get column types for this table
    const columnTypesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    const columnTypes = {};
    columnTypesResult.rows.forEach(row => {
      columnTypes[row.column_name] = row.data_type;
    });
    
    // Begin transaction for safe import
    await client.query('BEGIN');
    
    try {
      // Clear existing data (except for critical system data)
      if (!['users'].includes(tableName)) {
        await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      }
      
      // Get column names from first record
      const columns = Object.keys(data[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnList = columns.join(', ');
      
      const insertQuery = `
        INSERT INTO ${tableName} (${columnList}) 
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      // Import data in batches for better performance
      const BATCH_SIZE = 100;
      let imported = 0;
      
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        
        for (const record of batch) {
          try {
            const values = columns.map(col => {
              const value = record[col];
              const dataType = columnTypes[col];
              
              // Handle JSONB columns properly
              if (dataType === 'jsonb' && value !== null && value !== undefined) {
                // If it's already a string (JSON), parse and re-stringify to ensure valid JSON
                if (typeof value === 'string') {
                  try {
                    const parsed = JSON.parse(value);
                    return JSON.stringify(parsed);
                  } catch {
                    // If parsing fails, treat as regular string
                    return JSON.stringify(value);
                  }
                } else {
                  // If it's an object, stringify it
                  return JSON.stringify(value);
                }
              }
              
              return value;
            });
            
            await client.query(insertQuery, values);
            imported++;
          } catch (error) {
            console.warn(`    Warning: Failed to import record to ${tableName}:`, error.message);
            // Log the problematic record for debugging
            console.warn(`    Problematic record:`, JSON.stringify(record, null, 2));
          }
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`  ✅ Successfully imported ${imported}/${data.length} records to ${tableName}`);
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error(`  ❌ Error importing ${tableName}:`, error.message);
  }
}

async function importProductionData(importFile = null) {
  console.log('🚀 Starting production data import...\n');
  
  try {
    // Determine import file
    const dataFile = importFile || path.join(EXPORT_DIR, 'latest.json');
    
    // Check if file exists
    try {
      await fs.access(dataFile);
    } catch {
      console.error(`❌ Import file not found: ${dataFile}`);
      console.log('💡 Run export script first: npm run export:production');
      process.exit(1);
    }
    
    // Load export data
    const fileContent = await fs.readFile(dataFile, 'utf-8');
    const exportData = JSON.parse(fileContent);
    
    console.log(`📁 Importing from: ${dataFile}`);
    console.log(`📅 Export date: ${exportData.exportDate}`);
    console.log(`📦 Version: ${exportData.version}\n`);
    
    // Connect to database using pool
    const client = await pool.connect();
    
    // Import tables in dependency order
    const importOrder = [
      'users',           // Admin users first
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
      'settings'         // Settings last to override any defaults
    ];
    
    for (const tableName of importOrder) {
      if (exportData.tables[tableName]) {
        await importTable(client, tableName, exportData.tables[tableName]);
      }
    }
    
    console.log('\n✅ Production data import completed successfully!');
    console.log('🌐 Your production site should now be fully functional');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importFile = process.argv[2];
  importProductionData(importFile);
}

export { importProductionData };