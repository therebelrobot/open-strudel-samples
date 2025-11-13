import { useState, useCallback } from 'react';
import { searchStrudelFiles } from '../utils/github-api';
import type { GitHubCodeSearchItem } from '../types/github';

interface UseGitHubSearchResult {
  results: GitHubCodeSearchItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
  isLoading: boolean;
  error: string | null;
  search: (query?: string, page?: number) => Promise<void>;
  reset: () => void;
}

const PER_PAGE = 30;

export function useGitHubSearch(): UseGitHubSearchResult {
  const [results, setResults] = useState<GitHubCodeSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query?: string, page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await searchStrudelFiles(query, page, PER_PAGE);

      // Filter out results that don't exactly match "strudel.json"
      // This catches any false positives that GitHub search might return
      const filteredResults = data.items.filter(item => {
        const filename = item.name.toLowerCase();
        return filename === 'strudel.json';
      });

      setResults(filteredResults);
      setTotalCount(data.total_count); // Keep GitHub's total count for pagination
      setCurrentPage(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search GitHub';
      setError(message);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setCurrentPage(1);
    setError(null);
  }, []);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return {
    results,
    totalCount,
    currentPage,
    totalPages,
    perPage: PER_PAGE,
    isLoading,
    error,
    search,
    reset,
  };
}