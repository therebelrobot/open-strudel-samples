export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubCodeSearchItem[];
}

export interface GitHubCodeSearchItem {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: GitHubRepository;
  score: number;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

export interface GitHubOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}