#!/usr/bin/env node
/**
 * Safe Production → Development Data Sync
 * Exports sanitized data from production to seed development environment
 * REMOVES all sensitive data (PII, payments, bookings) for security
 */

import { pool } from '../server/db.js';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = './scripts/production-data';

// SAFE CONTENT TABLES ONLY - No sensitive data
const SAFE_TABLES = [
  'property',           // Property information (safe)
  'amenities',         // Amenity list (safe)
  'amenity_categories', // Categories (safe)
  'property_amenities', // Property-amenity relationships (safe)
  'photos',            // Property photos (safe)
  'nearby_attractions', // Attractions (safe)
  'settings',          // Site settings (safe)
  'email_templates',   // Email templates (safe - no personal data)
  'block_types',       // Content block types (safe)
  'content_blocks',    // Content blocks (safe)
  'page_layouts',      // Layout definitions (safe)
  'pricing_rules'      // Pricing rules (safe)
];

// DANGEROUS TABLES - NEVER SYNC TO DEV
const NEVER_SYNC_TABLES = [
  'bookings',           // Contains payment info, guest PII
  'guests',            // Personal information
  'guest_reviews',     // Guest PII in reviews
  'airbnb_reviews',    // May contain guest info
  'messages',          // Personal communications
  'chat_messages',     // Personal communications
  'audit_logs',        // Production activity logs
  'email_events',      // Email delivery logs with PII
  'users',            // Admin credentials - handle separately
  'sync_runs',        // Production sync history
  'external_reservations', // Booking data
  'holds',            // Reservation holds
  'blackout_dates'    // May contain sensitive booking patterns
];

async function sanitizedExport(client, tableName) {
  console.log(`📋 Exporting ${tableName} (sanitized)...`);
  
  try {
    let query = `SELECT * FROM ${tableName}`;
    let rows = [];
    
    // Special sanitization handling
    if (tableName === 'settings') {
      // Remove any API keys or sensitive settings
      query = `SELECT key, value FROM ${tableName} WHERE key NOT LIKE '%key%' AND key NOT LIKE '%secret%' AND key NOT LIKE '%password%'`;
      const result = await client.query(query);
      rows = result.rows || [];
    } else if (tableName === 'email_templates') {
      // Email templates are safe but remove any test data
      query = `SELECT * FROM ${tableName} WHERE template_type != 'test'`;
      const result = await client.query(query);
      rows = result.rows || [];
    } else {
      // Standard export for safe tables
      const result = await client.query(query);
      rows = result.rows || [];
    }
    
    console.log(`  ✅ Exported ${rows.length} sanitized records from ${tableName}`);
    return rows;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function importSanitizedData(client, sanitizedData) {
  console.log('\n📥 Importing sanitized data to development database...\n');
  
  // Import tables in dependency order (same as production import)
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
    'settings'         // Settings last to override defaults
  ];
  
  for (const tableName of importOrder) {
    if (sanitizedData.tables[tableName] && sanitizedData.tables[tableName].length > 0) {
      console.log(`📋 Importing ${sanitizedData.tables[tableName].length} records to ${tableName}...`);
      
      try {
        // Clear existing data
        await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
        
        // Insert sanitized data
        const data = sanitizedData.tables[tableName];
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
        
        console.log(`  ✅ Successfully imported ${data.length} records to ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Error importing ${tableName}:`, error.message);
        throw error;
      }
    } else {
      console.log(`⏭️  Skipping ${tableName} - no data to import`);
    }
  }
}

export async function syncDevFromProduction() {
  console.log('🔒 Starting SAFE Production → Development sync...\n');
  console.log('🛡️  This sync ONLY includes content - NO sensitive data\n');
  
  try {
    // Ensure export directory exists
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    // Connect to database
    const client = await pool.connect();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.0.0-sanitized',
      type: 'development-safe',
      warning: 'This export contains ONLY safe content data - no PII or sensitive information',
      tables: {}
    };
    
    console.log('📊 Exporting safe content tables...\n');
    
    // Export only safe tables with sanitization
    for (const tableName of SAFE_TABLES) {
      const data = await sanitizedExport(client, tableName);
      exportData.tables[tableName] = data;
    }
    
    // Create test admin user for development (not from production)
    console.log('👤 Creating safe development admin user...');
    exportData.tables['users'] = [{
      id: 'dev-admin-001',
      email: 'admin@vacationrentaloahu.co',
      password: '$argon2id$v=19$m=65536,t=3,p=4$dev-password-hash', // Placeholder hash
      role: 'admin',
      created_at: new Date().toISOString()
    }];
    
    // Save sanitized export
    const sanitizedFile = path.join(EXPORT_DIR, `sanitized-dev-sync-${Date.now()}.json`);
    await fs.writeFile(sanitizedFile, JSON.stringify(exportData, null, 2));
    
    // Save as latest for development import
    const latestDevFile = path.join(EXPORT_DIR, 'latest-dev-safe.json');
    await fs.writeFile(latestDevFile, JSON.stringify(exportData, null, 2));
    
    // Now IMPORT the sanitized data into development database
    console.log('\n🔄 Now importing sanitized data to development database...');
    
    await client.query('BEGIN');
    try {
      await importSanitizedData(client, exportData);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    
    console.log('\n✅ SAFE Production → Development sync completed!');
    console.log('🔒 Security: All sensitive data excluded');
    console.log('💾 Files saved:');
    console.log(`   🗂️  Full export: ${sanitizedFile}`);
    console.log(`   🗂️  Latest: ${latestDevFile}`);
    console.log('📥 Development database seeded with sanitized production data');
    console.log('\n🚨 EXCLUDED from sync (for security):');
    NEVER_SYNC_TABLES.forEach(table => console.log(`   ❌ ${table}`));
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncDevFromProduction();
}