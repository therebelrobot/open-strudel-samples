import { useMemo } from 'react';
import { RepositoryCard } from './RepositoryCard';
import { useSoundStore } from '../store/soundStore';
import type { GitHubCodeSearchItem } from '../types/github';
import type { Sound } from '../types/strudel';

interface RepositoryListProps {
  results: GitHubCodeSearchItem[];
  totalCount: number;
  onLoadRepository: (item: GitHubCodeSearchItem) => void;
  onPlaySound: (sound: Sound) => void;
  onStopSound: () => void;
  loadingItemPath?: string;
}

export function RepositoryList({
  results,
  totalCount,
  onLoadRepository,
  onPlaySound,
  onStopSound,
  loadingItemPath,
}: RepositoryListProps) {
  const isBlocked = useSoundStore((state) => state.isBlocked);
  const blockedRepos = useSoundStore((state) => state.blockedRepos);
  
  // Filter out blocked repositories
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const repoKey = `${item.repository.owner.login}/${item.repository.name}/${item.path}`;
      return !isBlocked(repoKey);
    });
  }, [results, isBlocked, blockedRepos]);

  const blockedCount = results.length - filteredResults.length;

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Search Results
        </h2>
        <p className="text-sm text-gray-600">
          Found {totalCount} repositories with strudel.json files
          {totalCount > results.length && ` (showing ${results.length})`}
          {blockedCount > 0 && ` • ${blockedCount} blocked`}
        </p>
      </div>

      {blockedCount > 0 && (
        <div className="mb-3 p-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">
          ℹ️ {blockedCount} non-Strudel {blockedCount === 1 ? 'repository' : 'repositories'} hidden
        </div>
      )}

      <div className="space-y-3">
        {filteredResults.map((item) => (
          <RepositoryCard
            key={`${item.repository.full_name}/${item.path}`}
            item={item}
            onLoad={onLoadRepository}
            onPlay={onPlaySound}
            onStop={onStopSound}
            isLoading={loadingItemPath === item.path}
          />
        ))}
      </div>

      {filteredResults.length === 0 && blockedCount > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-gray-600">
          <p className="mb-2">All search results are blocked</p>
          <p className="text-sm">Go to Settings to manage your blocklist</p>
        </div>
      )}

      {totalCount > results.length && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          💡 Showing first {results.length} results. Use more specific search queries to narrow down results.
        </div>
      )}
    </div>
  );
}