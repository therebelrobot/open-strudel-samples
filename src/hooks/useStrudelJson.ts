import { useState, useCallback } from 'react';
import { fetchStrudelJson, buildRawUrl, fetchCustomUrlContent } from '../utils/github-api';
import { extractSounds } from '../utils/sound-processor';
import { useSoundStore } from '../store/soundStore';
import type { GitHubCodeSearchItem } from '../types/github';
import type { LoadedRepository, StrudelJson } from '../types/strudel';

interface UseStrudelJsonResult {
  isLoading: boolean;
  error: string | null;
  loadRepository: (item: GitHubCodeSearchItem) => Promise<void>;
  loadCustomUrlRepository: (url: string, name: string) => Promise<void>;
}

export function useStrudelJson(): UseStrudelJsonResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addPreview = useSoundStore((state) => state.addPreview);
  const saveRepository = useSoundStore((state) => state.saveRepository);
  const addCustomUrl = useSoundStore((state) => state.addCustomUrl);

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

  const loadCustomUrlRepository = useCallback(async (url: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch the JSON content from the custom URL
      const content = await fetchCustomUrlContent(url);

      // Parse the JSON content
      const strudelJson: StrudelJson = JSON.parse(content);

      // Use custom values for owner and repo to identify this as a custom URL
      const owner = 'custom';
      const repo = name.replace(/\s+/g, '-').toLowerCase();
      const path = 'strudel.json';

      // Extract sounds
      const sounds = extractSounds(strudelJson, owner, repo, path);

      // Create loaded repository object
      const loadedRepo: LoadedRepository = {
        owner,
        repo,
        path,
        branch: 'main',
        strudel_json_url: url,
        raw_json_url: url,
        sounds,
        loaded_at: new Date().toISOString(),
        isCustomUrl: true
      };

      // Add to preview store
      addPreview(loadedRepo);

      // Also save it directly to saved repositories
      saveRepository(loadedRepo);

      // Save the custom URL for future use
      addCustomUrl(url, name);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load custom URL';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addPreview, saveRepository, addCustomUrl]);

  return {
    isLoading,
    error,
    loadRepository,
    loadCustomUrlRepository
  };
}