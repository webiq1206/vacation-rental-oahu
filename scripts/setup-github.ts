#!/usr/bin/env node
/**
 * GitHub Repository Setup for VacationRentalOahu.co
 * Initializes repository and pushes current codebase to GitHub
 */

import { initializeRepository, pushToRepository, updateFile } from './github-utils.js';
import fs from 'fs/promises';
import path from 'path';

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
  'logs'
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
 * Recursively collect all files to sync to GitHub
 */
async function collectFiles(dir: string): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  
  async function walkDir(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const relativePath = fullPath.replace(process.cwd() + '/', '');
          files.push({ path: relativePath, content });
        } catch (error) {
          // Skip binary files or files that can't be read as text
          console.warn(`⚠️  Skipping file (binary or unreadable): ${fullPath}`);
        }
      }
    }
  }
  
  await walkDir(dir);
  return files;
}

/**
 * Create README.md for the repository
 */
function createReadme(): string {
  return `# VacationRentalOahu.co - Beach House Vacation Rental Platform

A sophisticated vacation rental website for a beachfront property in Oahu, Hawaii, featuring modern Four Seasons/Cappa-level typography and comprehensive booking functionality.

## 🏝️ Features

- **Beautiful Frontend**: Playfair Display typography with tropical color palette
- **Booking System**: Real-time availability checking and secure payments via Stripe
- **Admin Panel**: Comprehensive property and booking management
- **Email Automation**: Automated guest communications via Resend/SendGrid
- **SEO Optimized**: Targeting "Beach House Oahu" and "Vacation Rental Oahu" keywords

## 🛠️ Technology Stack

### Frontend
- **React 18 + TypeScript**: Modern component architecture
- **Tailwind CSS**: Responsive design with custom tropical theme
- **Shadcn/ui**: Consistent component library
- **TanStack Query**: Server state management
- **Wouter**: Lightweight routing

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Primary database with Neon hosting
- **Drizzle ORM**: Type-safe database operations
- **Stripe**: Secure payment processing
- **Passport.js**: Session-based authentication

### External Services
- **Replit**: Development and hosting platform
- **Neon**: PostgreSQL database hosting
- **Stripe**: Payment processing
- **Resend/SendGrid**: Email delivery

## 🚀 Development

This project is primarily developed and hosted on Replit with GitHub for version control and backup.

### Local Development
\`\`\`bash
npm install
npm run dev
\`\`\`

### Database Migrations
\`\`\`bash
npm run db:generate
npm run db:push
\`\`\`

## 📦 Deployment

The application is deployed on Replit with automatic builds and deployment pipeline.

### Environment Variables Required:
- \`DATABASE_URL\`: PostgreSQL connection string
- \`STRIPE_SECRET_KEY\`: Stripe payment processing
- \`RESEND_API_KEY\`: Email delivery service
- \`SESSION_SECRET\`: Session security
- \`GOOGLE_MAPS_API_KEY\`: Maps integration

## 🔒 Security Features

- Session-based authentication for admin access
- Rate limiting on API endpoints
- Input validation with Zod schemas
- CSRF protection
- Secure payment tokenization

## 📊 Database Schema

The application uses a normalized PostgreSQL schema with tables for:
- Users & Authentication
- Property Management
- Booking System
- Payment Processing
- Email Templates
- Audit Logging

## 🎨 Design

The site features sophisticated typography using Playfair Display serif fonts, creating an elegant Four Seasons/Cappa-level aesthetic that reflects the luxury nature of the beachfront vacation rental.

## 📞 Support

For technical support or inquiries, please use the GitHub Issues tab.

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Create .gitignore file
 */
function createGitignore(): string {
  return `# Dependencies
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

# Replit specific
.replit
.upm/
.breakpoints

# Database
*.sqlite
*.sqlite3
production-copy.sql

# Logs
logs/
*.log
tmp/

# Cache
.cache/
.parcel-cache/

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

# Runtime
.pid
.seed
.pid.lock

# Coverage
coverage/
.nyc_output/

# Dependency directories
jspm_packages/
bower_components/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# Stores VSCode versions used for testing VSCode extensions
.vscode-test/
`;
}

/**
 * Main setup function
 */
async function setupGitHub() {
  console.log('🚀 Setting up GitHub repository for VacationRentalOahu.co...\n');
  
  try {
    // Step 1: Initialize GitHub repository
    console.log('📁 Step 1: Initializing GitHub repository...');
    const repoInfo = await initializeRepository('vacation-rental-oahu');
    console.log(`✅ Repository ready: ${repoInfo.url}\n`);
    
    // Step 2: Collect all project files
    console.log('📦 Step 2: Collecting project files...');
    const files = await collectFiles(process.cwd());
    console.log(`📊 Found ${files.length} files to sync\n`);
    
    // Step 3: Add essential files
    console.log('📄 Step 3: Adding essential repository files...');
    
    // Add README.md
    await updateFile(
      repoInfo.owner,
      repoInfo.repo,
      'README.md',
      createReadme(),
      'Add comprehensive README with project documentation'
    );
    
    // Add .gitignore
    await updateFile(
      repoInfo.owner,
      repoInfo.repo,
      '.gitignore',
      createGitignore(),
      'Add .gitignore to exclude sensitive and build files'
    );
    
    console.log('✅ Essential files added\n');
    
    // Step 4: Push all project files
    console.log('📤 Step 4: Pushing project files to GitHub...');
    
    // Split files into batches to avoid GitHub API limits
    const batchSize = 50;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(files.length / batchSize);
      
      console.log(`📦 Pushing batch ${batchNum}/${totalBatches} (${batch.length} files)...`);
      
      await pushToRepository(
        repoInfo.owner,
        repoInfo.repo,
        batch,
        `Sync VacationRentalOahu.co codebase - Batch ${batchNum}/${totalBatches}`
      );
      
      // Small delay to be gentle with GitHub API
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 GitHub setup completed successfully!');
    console.log(`📁 Repository: ${repoInfo.url}`);
    console.log(`👤 Owner: ${repoInfo.owner}`);
    console.log(`📊 Files synced: ${files.length}`);
    console.log('\n🔗 Next steps:');
    console.log('  1. Database migrations will be set up next');
    console.log('  2. Automated backup system will be configured');
    console.log('  3. GitHub Actions workflow will be created');
    
    return repoInfo;
    
  } catch (error) {
    console.error('\n❌ GitHub setup failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGitHub().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { setupGitHub };