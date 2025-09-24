#!/usr/bin/env node
/**
 * GitHub Integration Utilities for VacationRentalOahu.co
 * Handles repository management, version control, and automated sync
 */

import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

/**
 * Initialize GitHub repository for VacationRentalOahu.co
 */
export async function initializeRepository(repoName: string = 'vacation-rental-oahu') {
  console.log('🚀 Initializing GitHub repository...');
  
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    // Check if repository exists
    let repo;
    try {
      const { data: existingRepo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });
      console.log(`📁 Repository already exists: ${existingRepo.html_url}`);
      repo = existingRepo;
    } catch (error: any) {
      if (error.status === 404) {
        // Create new repository
        console.log('🆕 Creating new repository...');
        const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'Beach House Vacation Rental Platform - VacationRentalOahu.co',
          private: false,
          has_issues: true,
          has_projects: true,
          has_wiki: false,
          auto_init: true
        });
        console.log(`✅ Repository created: ${newRepo.html_url}`);
        repo = newRepo;
      } else {
        throw error;
      }
    }
    
    return {
      owner: user.login,
      repo: repoName,
      url: repo.html_url,
      clone_url: repo.clone_url
    };
    
  } catch (error) {
    console.error('❌ GitHub repository initialization failed:', error);
    throw error;
  }
}

/**
 * Push files to GitHub repository
 */
export async function pushToRepository(
  owner: string, 
  repo: string, 
  files: { path: string; content: string }[],
  commitMessage: string = 'Update from Replit development'
) {
  console.log(`📤 Pushing ${files.length} files to GitHub...`);
  
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get current commit SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    });
    const commitSha = ref.object.sha;
    
    // Get base tree
    const { data: commit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha
    });
    const treeSha = commit.tree.sha;
    
    // Create tree with new files
    const tree = files.map(file => ({
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: file.content
    }));
    
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree
    });
    
    // Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [commitSha]
    });
    
    // Update reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha
    });
    
    console.log(`✅ Successfully pushed to GitHub: ${newCommit.sha.substring(0, 7)}`);
    return newCommit.sha;
    
  } catch (error) {
    console.error('❌ Failed to push to GitHub:', error);
    throw error;
  }
}

/**
 * Create or update a file in the repository
 */
export async function updateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string
) {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Check if file exists to get SHA
    let sha: string | undefined;
    try {
      const { data: file } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      if ('sha' in file) {
        sha = file.sha;
      }
    } catch (error: any) {
      // File doesn't exist - that's fine for creating new files
      if (error.status !== 404) {
        throw error;
      }
    }
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      ...(sha && { sha })
    });
    
    console.log(`✅ Updated file: ${path}`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${path}:`, error);
    throw error;
  }
}

/**
 * Get repository information and recent commits
 */
export async function getRepositoryInfo(owner: string, repo: string) {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const [repoData, commits] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listCommits({ owner, repo, per_page: 5 })
    ]);
    
    return {
      repository: repoData.data,
      recentCommits: commits.data
    };
    
  } catch (error) {
    console.error('❌ Failed to get repository info:', error);
    throw error;
  }
}