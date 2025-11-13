import { useState, useCallback } from 'react';
import { fetchStrudelJson, buildRawUrl } from '../utils/github-api';
import { extractSounds } from '../utils/sound-processor';
import { useSoundStore } from '../store/soundStore';
import type { GitHubCodeSearchItem } from '../types/github';
import type { LoadedRepository } from '../types/strudel';

interface UseStrudelJsonResult {
  isLoading: boolean;
  error: string | null;
  loadRepository: (item: GitHubCodeSearchItem) => Promise<void>;
}

export function useStrudelJson(): UseStrudelJsonResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addPreview = useSoundStore((state) => state.addPreview);

  const loadRepository = useCallback(async (item: GitHubCodeSearchItem) => {
    setIsLoading(true);
    setError(null);

    try {
      const { repository, path } = item;
      const owner = repository.owner.login;
      const repo = repository.name;
      const branch = repository.default_branch;

      // Fetch and parse strudel.json
      const strudelJson = await fetchStrudelJson(item);

      // Extract sounds
      const sounds = extractSounds(strudelJson, owner, repo, path);

      // Build URLs
      const rawJsonUrl = buildRawUrl(owner, repo, branch, path);
      const strudelJsonUrl = item.html_url;

      // Create loaded repository object
      const loadedRepo: LoadedRepository = {
        owner,
        repo,
        path,
        branch,
        strudel_json_url: strudelJsonUrl,
        raw_json_url: rawJsonUrl,
        sounds,
        loaded_at: new Date().toISOString(),
      };

      // Add to preview store (not saved until user favorites it)
      addPreview(loadedRepo);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strudel.json';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addPreview]);

  return {
    isLoading,
    error,
    loadRepository,
  };
}