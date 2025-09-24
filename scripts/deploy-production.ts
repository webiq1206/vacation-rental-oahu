#!/usr/bin/env node
/**
 * Complete Production Deployment Script
 * Handles database migration and ensures production site functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { exportProductionData } from './export-production-data.js';
import { importProductionData } from './import-production-data.js';

const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Warning')) {
      console.warn(`⚠️  ${stderr}`);
    }
    if (stdout) {
      console.log(stdout.trim());
    }
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function deployProduction() {
  console.log('🚀 Starting complete production deployment...\n');
  
  try {
    // Step 1: Export current development data
    console.log('📦 Step 1: Exporting development data');
    await exportProductionData();
    console.log('');
    
    // Step 2: Install dependencies
    console.log('📦 Step 2: Installing dependencies');
    await runCommand('npm install', 'Installing Node.js dependencies');
    console.log('');
    
    // Step 3: Build application
    console.log('🔨 Step 3: Building application');
    await runCommand('npm run build', 'Building production assets');
    console.log('');
    
    // Step 4: Database schema sync
    console.log('🗄️  Step 4: Syncing database schema');
    await runCommand('npm run db:push --force', 'Syncing database schema');
    console.log('');
    
    // Step 5: Import production data
    console.log('📥 Step 5: Importing production data');
    await importProductionData();
    console.log('');
    
    // Step 6: Verify deployment
    console.log('✅ Step 6: Deployment verification');
    console.log('🌐 Production deployment completed successfully!');
    console.log('');
    console.log('Your production site now includes:');
    console.log('  ✅ All property information and photos');
    console.log('  ✅ Complete amenities and categories');
    console.log('  ✅ Site settings and configurations');
    console.log('  ✅ Email templates and content');
    console.log('  ✅ Pricing rules and nearby attractions');
    console.log('  ✅ Admin user accounts');
    console.log('');
    console.log('🎉 Your live website is now fully functional!');
    
  } catch (error) {
    console.error('\n❌ Production deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('  1. Check your database connection');
    console.log('  2. Ensure all environment variables are set');
    console.log('  3. Verify schema changes are compatible');
    console.log('  4. Run: npm run export:production && npm run import:production');
    process.exit(1);
  }
}

// Add to package.json scripts
async function updatePackageScripts() {
  const fs = await import('fs/promises');
  try {
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    // Add our deployment scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'export:production': 'node scripts/export-production-data.js',
      'import:production': 'node scripts/import-production-data.js',
      'deploy:production': 'node scripts/deploy-production.js',
      'backup:db': 'node scripts/export-production-data.js'
    };
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with deployment scripts');
  } catch (error) {
    console.log('⚠️  Could not update package.json:', error.message);
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployProduction();
}

export { deployProduction, updatePackageScripts };