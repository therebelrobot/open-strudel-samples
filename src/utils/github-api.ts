import type { GitHubSearchResult, GitHubCodeSearchItem } from '../types/github';
import type { StrudelJson } from '../types/strudel';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

export class GitHubAPIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GitHubAPIError';
    this.status = status;
  }
}

/**
 * Get GitHub token from localStorage or environment
 */
function getGitHubToken(): string | null {
  // Check localStorage first
  const stored = localStorage.getItem('github_token');
  if (stored) return stored;

  // Check environment variable (for development)
  return import.meta.env.VITE_GITHUB_TOKEN || null;
}

/**
 * Search GitHub for strudel.json files
 * Note: GitHub Code Search API requires authentication
 * Note: Use exact filename match with quotes to exclude false matches like apple_strudel.json
 * @param query - Search query (default: filename:"strudel.json" for exact match)
 * @param page - Page number for pagination
 * @param perPage - Results per page (max 100)
 */
export async function searchStrudelFiles(
  query: string = 'filename:"strudel.json"',
  page: number = 1,
  perPage: number = 30
): Promise<GitHubSearchResult> {
  const url = new URL(`${GITHUB_API_BASE}/search/code`);
  url.searchParams.append('q', query);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('per_page', perPage.toString());

  const token = getGitHubToken();
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new GitHubAPIError(
          'GitHub Code Search requires authentication. Please add a GitHub Personal Access Token in Settings.',
          response.status
        );
      }

      throw new GitHubAPIError(
        errorData.message || `GitHub API error: ${response.statusText}`,
        response.status
      );
    }

    const data: GitHubSearchResult = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Failed to search GitHub'
    );
  }
}

/**
 * Set GitHub token in localStorage
 */
export function setGitHubToken(token: string): void {
  if (token.trim()) {
    localStorage.setItem('github_token', token.trim());
  } else {
    localStorage.removeItem('github_token');
  }
}

/**
 * Clear GitHub token from localStorage
 */
export function clearGitHubToken(): void {
  localStorage.removeItem('github_token');
}

/**
 * Check if GitHub token is set
 */
export function hasGitHubToken(): boolean {
  return !!getGitHubToken();
}

/**
 * Fetch raw content from GitHub
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param path - File path
 */
export async function fetchRawContent(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new GitHubAPIError(
        `Failed to fetch raw content: ${response.statusText}`,
        response.status
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Failed to fetch raw content'
    );
  }
}

/**
 * Fetch repository information from GitHub API
 * @param owner - Repository owner
 * @param repo - Repository name
 */
async function fetchRepositoryInfo(owner: string, repo: string): Promise<any> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const token = getGitHubToken();

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new GitHubAPIError(
        `Failed to fetch repository info: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Failed to fetch repository info'
    );
  }
}

/**
 * Fetch and parse strudel.json file
 * @param item - GitHub code search item
 */
export async function fetchStrudelJson(
  item: GitHubCodeSearchItem
): Promise<StrudelJson> {
  const { repository, path } = item;
  const owner = repository.owner.login;
  const repo = repository.name;

  // Get the actual default branch from GitHub API
  let branch = repository.default_branch;

  if (!branch) {
    try {
      const repoInfo = await fetchRepositoryInfo(owner, repo);
      branch = repoInfo.default_branch || 'main';
    } catch (error) {
      // If we can't get repo info, try common defaults
      console.warn(`Could not fetch repo info for ${owner}/${repo}, trying defaults`);
      branch = 'main';
    }
  }

  const content = await fetchRawContent(owner, repo, branch, path);

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new GitHubAPIError(
      `Failed to parse JSON from ${owner}/${repo}/${path}: ${error instanceof Error ? error.message : 'Invalid JSON'
      }`
    );
  }
}

/**
 * Build raw GitHub URL for a file
 */
export function buildRawUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Check if a URL is accessible (for validating sound URLs)
 */
export async function checkUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch content from a custom URL
 * @param url - The URL to fetch content from
 */
export async function fetchCustomUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new GitHubAPIError(
        `Failed to fetch content from custom URL: ${response.statusText}`,
        response.status
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Failed to fetch content from custom URL'
    );
  }
}