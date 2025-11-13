import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoadedRepository, Sound } from '../types/strudel';

interface SoundStore {
  // State
  previewRepositories: LoadedRepository[]; // Temporary preview (not persisted)
  savedRepositories: LoadedRepository[]; // Favorited/saved repos (persisted)
  currentlyPlaying: string | null;
  collapsedRepos: Set<string>;
  blockedRepos: Set<string>; // Blocked/non-Strudel repos (persisted)

  // Actions
  addPreview: (repository: LoadedRepository) => void;
  removePreview: (repoKey: string) => void;
  clearPreviews: () => void;
  saveRepository: (repository: LoadedRepository) => void;
  unsaveRepository: (repoKey: string) => void;
  setCurrentlyPlaying: (soundId: string | null) => void;
  importRepositories: (repositories: LoadedRepository[]) => void;
  importBlocklist: (blocklist: string[]) => void;
  toggleCollapsed: (repoKey: string) => void;
  blockRepository: (repoKey: string) => void;
  unblockRepository: (repoKey: string) => void;
  clearBlocklist: () => void;

  // Getters
  getAllPreviewSounds: () => Sound[];
  getAllSavedSounds: () => Sound[];
  getRepositoryKey: (repo: LoadedRepository) => string;
  isSaved: (repoKey: string) => boolean;
  isCollapsed: (repoKey: string) => boolean;
  isBlocked: (repoKey: string) => boolean;
  getPreviewRepository: (repoKey: string) => LoadedRepository | undefined;
  getBlockedRepos: () => string[];
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      previewRepositories: [],
      savedRepositories: [],
      currentlyPlaying: null,
      collapsedRepos: new Set(),
      blockedRepos: new Set(),

      addPreview: (repository) => {
        set((state) => {
          const key = get().getRepositoryKey(repository);

          // Check if already exists in preview
          const exists = state.previewRepositories.some(
            (repo) => get().getRepositoryKey(repo) === key
          );

          if (exists) {
            // Update existing preview
            return {
              previewRepositories: state.previewRepositories.map((repo) =>
                get().getRepositoryKey(repo) === key ? repository : repo
              ),
            };
          }

          // Add new preview
          return {
            previewRepositories: [...state.previewRepositories, repository],
          };
        });
      },

      removePreview: (repoKey) => {
        set((state) => ({
          previewRepositories: state.previewRepositories.filter(
            (repo) => get().getRepositoryKey(repo) !== repoKey
          ),
        }));
      },

      clearPreviews: () => {
        set({
          previewRepositories: [],
          currentlyPlaying: null,
        });
      },

      saveRepository: (repository) => {
        set((state) => {
          const key = get().getRepositoryKey(repository);

          // Check if already saved
          const exists = state.savedRepositories.some(
            (repo) => get().getRepositoryKey(repo) === key
          );

          if (exists) {
            return state; // Already saved
          }

          // Add to saved and remove from preview
          return {
            savedRepositories: [...state.savedRepositories, repository],
            previewRepositories: state.previewRepositories.filter(
              (repo) => get().getRepositoryKey(repo) !== key
            ),
          };
        });
      },

      unsaveRepository: (repoKey) => {
        set((state) => ({
          savedRepositories: state.savedRepositories.filter(
            (repo) => get().getRepositoryKey(repo) !== repoKey
          ),
        }));
      },

      setCurrentlyPlaying: (soundId) => {
        set({ currentlyPlaying: soundId });
      },

      importRepositories: (repositories) => {
        set({ savedRepositories: repositories });
      },

      importBlocklist: (blocklist) => {
        set({ blockedRepos: new Set(blocklist) });
      },

      toggleCollapsed: (repoKey) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedRepos);
          if (newCollapsed.has(repoKey)) {
            newCollapsed.delete(repoKey);
          } else {
            newCollapsed.add(repoKey);
          }
          return { collapsedRepos: newCollapsed };
        });
      },

      blockRepository: (repoKey) => {
        set((state) => {
          const newBlocked = new Set(state.blockedRepos);
          newBlocked.add(repoKey);
          // Remove from both preview and saved if present
          return {
            blockedRepos: newBlocked,
            previewRepositories: state.previewRepositories.filter(
              (repo) => get().getRepositoryKey(repo) !== repoKey
            ),
            savedRepositories: state.savedRepositories.filter(
              (repo) => get().getRepositoryKey(repo) !== repoKey
            ),
          };
        });
      },

      unblockRepository: (repoKey) => {
        set((state) => {
          const newBlocked = new Set(state.blockedRepos);
          newBlocked.delete(repoKey);
          return { blockedRepos: newBlocked };
        });
      },

      clearBlocklist: () => {
        set({ blockedRepos: new Set() });
      },

      getAllPreviewSounds: () => {
        const state = get();
        return state.previewRepositories.flatMap((repo) => repo.sounds);
      },

      getAllSavedSounds: () => {
        const state = get();
        return state.savedRepositories.flatMap((repo) => repo.sounds);
      },

      getRepositoryKey: (repo) => {
        return `${repo.owner}/${repo.repo}/${repo.path}`;
      },

      isSaved: (repoKey) => {
        const state = get();
        return state.savedRepositories.some(
          (repo) => get().getRepositoryKey(repo) === repoKey
        );
      },

      isCollapsed: (repoKey) => {
        return get().collapsedRepos.has(repoKey);
      },

      isBlocked: (repoKey) => {
        return get().blockedRepos.has(repoKey);
      },

      getPreviewRepository: (repoKey) => {
        const state = get();
        return state.previewRepositories.find(
          (repo) => get().getRepositoryKey(repo) === repoKey
        );
      },

      getBlockedRepos: () => {
        return Array.from(get().blockedRepos);
      },
    }),
    {
      name: 'strudel-sound-storage',
      version: 3, // Increment version for blocklist
      partialize: (state) => ({
        // Only persist saved repositories and blocklist, not previews
        savedRepositories: state.savedRepositories,
        collapsedRepos: state.collapsedRepos,
        blockedRepos: state.blockedRepos,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Convert arrays back to Sets
          if (data.state) {
            if (data.state.collapsedRepos && Array.isArray(data.state.collapsedRepos)) {
              data.state.collapsedRepos = new Set(data.state.collapsedRepos);
            }
            if (data.state.blockedRepos && Array.isArray(data.state.blockedRepos)) {
              data.state.blockedRepos = new Set(data.state.blockedRepos);
            }
            // Migration from old favoriteRepos structure
            if (data.state.favoriteRepos && !data.state.savedRepositories) {
              data.state.savedRepositories = data.state.loadedRepositories?.filter(
                (repo: LoadedRepository) => {
                  const key = `${repo.owner}/${repo.repo}/${repo.path}`;
                  return data.state.favoriteRepos.includes(key);
                }
              ) || [];
            }
          }
          return data;
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              // Convert Sets to arrays for storage
              collapsedRepos: Array.from(value.state.collapsedRepos || []),
              blockedRepos: Array.from(value.state.blockedRepos || []),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);