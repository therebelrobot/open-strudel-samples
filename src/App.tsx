import { useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { RepositoryList } from './components/RepositoryList';
import { SavedRepositoryCard } from './components/SavedRepositoryCard';
import { ExportImport } from './components/ExportImport';
import { Settings } from './components/Settings';
import { ToastContainer } from './components/ToastContainer';
import { Pagination } from './components/Pagination';
import { useGitHubSearch } from './hooks/useGitHubSearch';
import { useStrudelJson } from './hooks/useStrudelJson';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useToast } from './hooks/useToast';
import { useSoundStore } from './store/soundStore';
import { hasGitHubToken } from './utils/github-api';
import type { GitHubCodeSearchItem } from './types/github';
import type { Sound } from './types/strudel';

function App() {
  const [loadingItemPath, setLoadingItemPath] = useState<string>();
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  // GitHub search
  const { results, totalCount, currentPage, totalPages, isLoading: isSearching, error: searchError, search } = useGitHubSearch();
  
  // Strudel JSON loading
  const { error: loadError, loadRepository } = useStrudelJson();
  
  // Audio player
  const { play, stop } = useAudioPlayer();
  
  // Toast notifications
  const toast = useToast();
  
  // Store
  const savedRepositories = useSoundStore((state) => state.savedRepositories);

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    search(query, 1);
  };

  const handlePageChange = (page: number) => {
    search(currentQuery, page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadRepository = async (item: GitHubCodeSearchItem) => {
    setLoadingItemPath(item.path);
    try {
      await loadRepository(item);
    } catch (error) {
      console.error('Failed to load repository:', error);
      // Fail gracefully - error is already shown in UI via loadError state
    } finally {
      setLoadingItemPath(undefined);
    }
  };

  const handlePlaySound = async (sound: Sound) => {
    try {
      await play(sound.url, sound.id);
    } catch (error) {
      console.error('Failed to play sound:', error);
      toast.error(`Failed to play sound: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStopSound = () => {
    stop();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header with Settings */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Explore Strudel Sounds</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            type="button"
          >
            ⚙️ Settings
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <strong className="text-red-900 block mb-1">Search Error</strong>
                    <p className="text-red-800 mb-2">{searchError}</p>
                    {!hasGitHubToken() && (
                      <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        🔑 Add GitHub Token
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <strong>Error loading repository:</strong> {loadError}
              </div>
            )}

            <RepositoryList
              results={results}
              totalCount={totalCount}
              onLoadRepository={handleLoadRepository}
              onPlaySound={handlePlaySound}
              onStopSound={handleStopSound}
              loadingItemPath={loadingItemPath}
            />

            {results.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isSearching}
              />
            )}
          </div>

          {/* Divider */}
          {savedRepositories.length > 0 && results.length > 0 && (
            <div className="border-t-2 border-purple-300 my-6"></div>
          )}

          {/* Saved Sound Library Section */}
          {savedRepositories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-800">
                  ⭐ Saved Sound Library ({savedRepositories.length} {savedRepositories.length === 1 ? 'repository' : 'repositories'})
                </h3>
                <ExportImport />
              </div>
              
              <div className="space-y-3">
                {savedRepositories.map((repository) => (
                  <SavedRepositoryCard
                    key={`${repository.owner}/${repository.repo}/${repository.path}`}
                    repository={repository}
                    onPlay={handlePlaySound}
                    onStop={handleStopSound}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Strudel Sample Explorer • Built with React + Vite + Tailwind</p>
          <p className="mt-1 text-gray-400">
            Search GitHub for strudel.json files and explore Strudel sounds
          </p>
        </div>
      </footer>
      
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <ToastContainer />
    </div>
  );
}

export default App;
