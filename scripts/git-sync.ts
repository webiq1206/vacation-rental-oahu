#!/usr/bin/env node
/**
 * Git-based GitHub Sync for VacationRentalOahu.co
 * Uses git CLI for proper binary file handling and complete backup
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const REPO_URL = 'https://github.com/webiq1206/vacation-rental-oahu.git';
const REPO_NAME = 'vacation-rental-oahu';

/**
 * Initialize git repository and connect to GitHub
 */
async function initializeGitRepo() {
  console.log('🔧 Initializing Git repository...');
  
  try {
    // Check if .git exists
    try {
      await fs.access('.git');
      console.log('✅ Git repository already exists');
    } catch {
      // Initialize git repo
      console.log('📦 Initializing new Git repository...');
      execSync('git init', { stdio: 'pipe' });
      console.log('✅ Git repository initialized');
    }
    
    // Check if GitHub remote exists
    try {
      const remotes = execSync('git remote -v', { encoding: 'utf-8', stdio: 'pipe' });
      if (remotes.includes('origin')) {
        console.log('✅ GitHub remote already configured');
      } else {
        throw new Error('No origin remote');
      }
    } catch {
      // Add GitHub remote
      console.log('🔗 Adding GitHub remote...');
      execSync(`git remote add origin ${REPO_URL}`, { stdio: 'pipe' });
      console.log('✅ GitHub remote added');
    }
    
    // Configure git user if needed
    try {
      execSync('git config user.name', { stdio: 'pipe' });
      execSync('git config user.email', { stdio: 'pipe' });
    } catch {
      console.log('👤 Configuring Git user...');
      execSync('git config user.name "VacationRentalOahu"', { stdio: 'pipe' });
      execSync('git config user.email "admin@vacationrentaloahu.co"', { stdio: 'pipe' });
    }
    
  } catch (error) {
    console.error('❌ Git initialization failed:', error);
    throw error;
  }
}

/**
 * Create comprehensive .gitignore
 */
async function createGitignore() {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.*.local

# Build outputs
dist/
build/
.next/
.nuxt/

# Replit specific (but keep essential files)
.replit
.upm/
.breakpoints

# Database backups (but keep migration scripts)
production-copy.sql
*.backup.sql

# Logs and temporary files
logs/
*.log
tmp/
.pid
.seed
.pid.lock

# Cache directories
.cache/
.parcel-cache/
.nyc_output/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Local state (but keep essential configs)
.local/state/replit/agent/
.local/state/replit/lsp/

# Runtime
.npm
.eslintcache
.yarn-integrity

# Coverage
coverage/

# Optional directories
jspm_packages/
bower_components/

# Keep attached assets for backup!
# attached_assets/ - INCLUDE these for complete backup

# dotenv environment variables file
.env.test

# Stores VSCode versions used for testing VSCode extensions
.vscode-test/
`;

  await fs.writeFile('.gitignore', gitignoreContent);
  console.log('✅ .gitignore created');
}

/**
 * Get GitHub token for authentication
 */
async function getGitHubToken(): Promise<string> {
  try {
    // Use the same token retrieval as in github-utils.ts
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }

    const connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || 
                       connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      throw new Error('GitHub not connected');
    }
    
    return accessToken;
  } catch (error) {
    console.error('❌ Failed to get GitHub token:', error);
    throw error;
  }
}

/**
 * Sync all files to GitHub using git CLI
 */
async function syncToGitHub(commitMessage: string = 'Complete VacationRentalOahu.co sync with assets') {
  console.log('📤 Syncing to GitHub with git CLI...');
  
  try {
    // Get GitHub token for authentication
    const token = await getGitHubToken();
    
    // Set up authentication URL
    const authUrl = `https://${token}@github.com/webiq1206/vacation-rental-oahu.git`;
    
    // Update remote URL with token
    execSync(`git remote set-url origin ${authUrl}`, { stdio: 'pipe' });
    
    // Add all files (respecting .gitignore)
    console.log('📦 Adding files...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Check what's staged
    const status = execSync('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
    const stagedFiles = status.split('\n').filter(line => line.trim()).length;
    console.log(`📊 Staged ${stagedFiles} files for commit`);
    
    // Commit changes
    console.log('💾 Committing changes...');
    try {
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log('✅ Changes committed');
    } catch (error: any) {
      if (error.message?.includes('nothing to commit')) {
        console.log('ℹ️  No changes to commit - repository is up to date');
        return;
      }
      throw error;
    }
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push -u origin main', { stdio: 'inherit' });
    
    console.log('✅ Successfully synced to GitHub!');
    console.log(`📁 Repository: https://github.com/webiq1206/vacation-rental-oahu`);
    
  } catch (error) {
    console.error('❌ Sync to GitHub failed:', error);
    throw error;
  }
}

/**
 * Main sync function
 */
async function performGitSync() {
  console.log('🔄 Starting Git-based GitHub sync...\n');
  
  try {
    await initializeGitRepo();
    await createGitignore();
    await syncToGitHub();
    
    console.log('\n🎉 Git sync completed successfully!');
    console.log('✅ All files (including binary assets) synced to GitHub');
    console.log('✅ Complete backup available for site restoration');
    console.log('✅ Foundation ready for automated deployment pipeline');
    
  } catch (error) {
    console.error('\n❌ Git sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performGitSync().catch(error => {
    console.error('Git sync failed:', error);
    process.exit(1);
  });
}

export { performGitSync };