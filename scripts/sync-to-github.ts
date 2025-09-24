#!/usr/bin/env node
/**
 * GitHub File Sync for VacationRentalOahu.co
 * Syncs individual files to avoid GitHub API batch limits
 */

import { getUncachableGitHubClient, updateFile } from './github-utils.js';
import fs from 'fs/promises';
import path from 'path';

const REPO_OWNER = 'webiq1206';
const REPO_NAME = 'vacation-rental-oahu';

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.replit',
  '.git',
  'production-copy.sql',
  'dist',
  'build',
  '.env',
  '.env.local',
  'tmp',
  'logs',
  'attached_assets', // Skip attached assets for now due to size
  '.cache', // Skip cache files
  '.local', // Skip local state and agent files
  '.upm' // Skip upm files
];

const EXCLUDE_EXTENSIONS = ['.log', '.tmp', '.cache'];

/**
 * Check if file should be excluded from GitHub sync
 */
function shouldExclude(filePath: string): boolean {
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (relativePath.includes(pattern)) {
      return true;
    }
  }
  
  // Check file extensions
  const ext = path.extname(filePath);
  if (EXCLUDE_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  return false;
}

/**
 * Recursively collect all files to sync
 */
async function collectFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walkDir(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (shouldExclude(fullPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Cannot read directory: ${currentDir}`);
    }
  }
  
  await walkDir(dir);
  return files;
}

/**
 * Sync individual file to GitHub
 */
async function syncFile(filePath: string): Promise<boolean> {
  try {
    const relativePath = filePath.replace(process.cwd() + '/', '');
    const content = await fs.readFile(filePath, 'utf-8');
    
    await updateFile(
      REPO_OWNER,
      REPO_NAME,
      relativePath,
      content,
      `Sync: ${relativePath}`
    );
    
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('too large')) {
      console.warn(`⚠️  File too large, skipping: ${filePath}`);
      return false;
    }
    console.error(`❌ Failed to sync ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main sync function
 */
async function syncToGitHub() {
  console.log('🔄 Starting incremental sync to GitHub...\n');
  
  try {
    // Test GitHub connection
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Connected as: ${user.login}`);
    
    // Collect files
    console.log('📦 Collecting files...');
    const allFiles = await collectFiles(process.cwd());
    console.log(`📊 Found ${allFiles.length} files to sync\n`);
    
    // Sync files one by one
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      const relativePath = filePath.replace(process.cwd() + '/', '');
      const progress = `[${i + 1}/${allFiles.length}]`;
      
      console.log(`${progress} Syncing: ${relativePath}`);
      
      try {
        const success = await syncFile(filePath);
        if (success) {
          syncedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error with ${relativePath}:`, error);
      }
      
      // Small delay to be gentle with GitHub API
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Sync completed!');
    console.log(`✅ Synced: ${syncedCount} files`);
    console.log(`⚠️  Skipped: ${skippedCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log(`\n📁 Repository: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncToGitHub().catch(error => {
    console.error('Sync failed:', error);
    process.exit(1);
  });
}

export { syncToGitHub };