#!/usr/bin/env node
/**
 * Export Development Data as SQL INSERT statements
 * Creates SQL file that can be run in Production Database
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';

// Tables to export in dependency order
const TABLES = [
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

function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'object') {
    // Handle JSONB columns
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  
  return String(value);
}

async function exportTableAsSQL(client: any, tableName: string): Promise<string> {
  console.log(`📋 Exporting ${tableName}...`);
  
  try {
    const result = await client.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows || [];
    
    if (rows.length === 0) {
      console.log(`  ⏭️  No data in ${tableName}`);
      return `-- No data in ${tableName}\n`;
    }
    
    const columns = Object.keys(rows[0]);
    const columnList = columns.join(', ');
    
    let sql = `-- Data for table: ${tableName} (${rows.length} records)\n`;
    sql += `DELETE FROM ${tableName};\n`;
    
    for (const row of rows) {
      const values = columns.map(col => escapeValue(row[col])).join(', ');
      sql += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
    }
    
    sql += '\n';
    console.log(`  ✅ Exported ${rows.length} records from ${tableName}`);
    return sql;
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return `-- Error exporting ${tableName}: ${error.message}\n\n`;
  }
}

async function exportDevelopmentDataAsSQL() {
  console.log('📤 Starting SQL export from development database...\n');
  
  try {
    const client = await pool.connect();
    
    let fullSQL = `-- Development Database Export to SQL\n`;
    fullSQL += `-- Generated: ${new Date().toISOString()}\n`;
    fullSQL += `-- Run this SQL in your Production Database\n\n`;
    fullSQL += `BEGIN;\n\n`;
    
    // Export each table
    for (const tableName of TABLES) {
      const tableSQL = await exportTableAsSQL(client, tableName);
      fullSQL += tableSQL;
    }
    
    fullSQL += `COMMIT;\n`;
    fullSQL += `-- Export completed successfully\n`;
    
    // Save SQL file
    await fs.writeFile('production-copy.sql', fullSQL);
    
    client.release();
    
    console.log('\n✅ SQL export completed!');
    console.log('📁 File created: production-copy.sql');
    console.log('\n🎯 Next steps:');
    console.log('1. Switch to Production Database in Replit');
    console.log('2. Copy and paste the contents of production-copy.sql');
    console.log('3. Execute the SQL to populate production database');
    
  } catch (error) {
    console.error('❌ SQL export failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDevelopmentDataAsSQL();
}