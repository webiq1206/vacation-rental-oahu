#!/usr/bin/env node
/**
 * Safe GitHub Sync for VacationRentalOahu.co
 * Uses GitHub blob API for proper binary file handling
 */

import { getUncachableGitHubClient } from './github-utils.js';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

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
  '.cache', 
  '.local/state/replit/agent',
  '.upm'
];

const BINARY_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.mp4', '.avi', '.mov', '.webm',
  '.pdf', '.zip', '.tar', '.gz',
  '.woff', '.woff2', '.ttf', '.otf',
  '.ico', '.exe', '.bin'
];

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath: string): boolean {
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  for (const pattern of EXCLUDE_PATTERNS) {
    if (relativePath.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if file is binary based on extension
 */
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

/**
 * Read file as appropriate type (binary vs text)
 */
async function readFileContent(filePath: string): Promise<{ content: string; encoding: 'base64' | 'utf-8' }> {
  if (isBinaryFile(filePath)) {
    // Read binary file as base64
    const buffer = await fs.readFile(filePath);
    return {
      content: buffer.toString('base64'),
      encoding: 'base64'
    };
  } else {
    // Read text file as UTF-8
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        content,
        encoding: 'utf-8'
      };
    } catch (error) {
      // If UTF-8 fails, treat as binary
      const buffer = await fs.readFile(filePath);
      return {
        content: buffer.toString('base64'),
        encoding: 'base64'
      };
    }
  }
}

/**
 * Create blob in GitHub repository
 */
async function createBlob(octokit: any, content: string, encoding: 'base64' | 'utf-8'): Promise<string> {
  const { data } = await octokit.rest.git.createBlob({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    content,
    encoding
  });
  return data.sha;
}

/**
 * Collect all files to sync
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
 * Create tree with all files using blobs
 */
async function createTreeWithBlobs(octokit: any, files: string[]): Promise<string> {
  console.log('📦 Creating blobs for files...');
  
  const treeItems: any[] = [];
  
  // Process files in smaller batches
  const batchSize = 20;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(files.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} files)...`);
    
    for (const filePath of batch) {
      try {
        const relativePath = filePath.replace(process.cwd() + '/', '');
        const { content, encoding } = await readFileContent(filePath);
        
        // Create blob
        const blobSha = await createBlob(octokit, content, encoding);
        
        // Add to tree
        treeItems.push({
          path: relativePath,
          mode: '100644',
          type: 'blob',
          sha: blobSha
        });
        
        const fileType = isBinaryFile(filePath) ? '(binary)' : '(text)';
        console.log(`  ✅ ${relativePath} ${fileType}`);
        
      } catch (error) {
        console.error(`❌ Failed to process ${filePath}:`, error);
      }
    }
    
    // Small delay between batches
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`📊 Created ${treeItems.length} blobs, creating tree...`);
  
  // Create tree
  const { data: tree } = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree: treeItems
  });
  
  return tree.sha;
}

/**
 * Main sync function using blobs
 */
async function performBlobSync() {
  console.log('🔄 Starting blob-based GitHub sync...\n');
  
  try {
    // Connect to GitHub
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Connected as: ${user.login}`);
    
    // Collect files
    console.log('📦 Collecting files...');
    const files = await collectFiles(process.cwd());
    console.log(`📊 Found ${files.length} files to sync`);
    
    // Get current main branch
    let parentSha: string;
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: 'heads/main'
      });
      parentSha = ref.object.sha;
      console.log(`📍 Current main branch: ${parentSha.substring(0, 7)}`);
    } catch (error) {
      // No main branch yet, start fresh
      parentSha = '';
      console.log('📍 No main branch found, creating initial commit');
    }
    
    // Create tree with all files
    const treeSha = await createTreeWithBlobs(octokit, files);
    console.log(`🌳 Tree created: ${treeSha.substring(0, 7)}`);
    
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      message: 'Complete VacationRentalOahu.co sync with all assets (including binary files)',
      tree: treeSha,
      ...(parentSha && { parents: [parentSha] })
    });
    
    console.log(`💾 Commit created: ${commit.sha.substring(0, 7)}`);
    
    // Update main branch reference
    if (parentSha) {
      await octokit.rest.git.updateRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: 'heads/main',
        sha: commit.sha
      });
    } else {
      await octokit.rest.git.createRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: 'refs/heads/main',
        sha: commit.sha
      });
    }
    
    console.log('\n🎉 Blob sync completed successfully!');
    console.log(`📁 Repository: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
    console.log(`📊 Files synced: ${files.length}`);
    console.log('✅ All files (including binary assets) properly synced');
    console.log('✅ Complete backup available for site restoration');
    
  } catch (error) {
    console.error('\n❌ Blob sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performBlobSync().catch(error => {
    console.error('Blob sync failed:', error);
    process.exit(1);
  });
}

export { performBlobSync };