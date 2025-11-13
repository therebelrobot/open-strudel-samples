import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { setGitHubToken, clearGitHubToken, hasGitHubToken } from '../utils/github-api';
import { useToast } from '../hooks/useToast';
import { useSoundStore } from '../store/soundStore';
import { useStrudelJson } from '../hooks/useStrudelJson';
import type { CustomUrlRepository } from '../types/strudel';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  // Local state
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearBlocklistConfirm, setShowClearBlocklistConfirm] = useState(false);
  const [hasTokenState, setHasTokenState] = useState(false);
  const [blockedReposList, setBlockedReposList] = useState<string[]>([]);
  const [customUrlsList, setCustomUrlsList] = useState<CustomUrlRepository[]>([]);
  const [newCustomUrl, setNewCustomUrl] = useState('');
  const [newCustomUrlName, setNewCustomUrlName] = useState('');
  const [isLoadingCustomUrl, setIsLoadingCustomUrl] = useState(false);
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);
  
  // Refs to store functions without causing re-renders
  const storeRef = useRef({
    unblockRepository: (_key: string) => {},
    clearBlocklist: () => {},
    removeCustomUrl: (_url: string) => {},
    getCustomUrls: () => [] as CustomUrlRepository[]
  });
  
  const toast = useToast();
  const { loadCustomUrlRepository } = useStrudelJson();
  
  // Initialize state on mount only
  useEffect(() => {
    // Check if token exists
    setHasTokenState(hasGitHubToken());
    
    // Get store functions
    const store = useSoundStore.getState();
    storeRef.current = {
      unblockRepository: store.unblockRepository,
      clearBlocklist: store.clearBlocklist,
      removeCustomUrl: store.removeCustomUrl,
      getCustomUrls: store.getCustomUrls
    };
    
    // Get blocked repos
    setBlockedReposList(store.getBlockedRepos());
    
    // Get custom URLs
    setCustomUrlsList(store.getCustomUrls());
    
    // Subscribe to blockedRepos changes
    const unsubscribe = useSoundStore.subscribe(
      (state) => {
        // When blockedRepos or customUrls change, update our local state
        setBlockedReposList(state.getBlockedRepos());
        setCustomUrlsList(state.getCustomUrls());
      }
    );
    
    return unsubscribe;
  }, []);

  const handleSave = () => {
    setGitHubToken(token);
    setHasTokenState(true);
    toast.success('GitHub token saved! You can now search for repositories.');
    setToken('');
    onClose();
  };

  const handleClear = () => {
    clearGitHubToken();
    setHasTokenState(false);
    toast.info('GitHub token removed.');
    setShowClearConfirm(false);
    onClose();
  };

  const handleUnblock = (repoKey: string) => {
    storeRef.current.unblockRepository(repoKey);
    toast.info('Repository unblocked');
  };

  const handleClearBlocklist = () => {
    storeRef.current.clearBlocklist();
    toast.success('Blocklist cleared');
    setShowClearBlocklistConfirm(false);
  };
  
  const handleAddCustomUrl = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newCustomUrl.trim() || !newCustomUrlName.trim()) {
      toast.error('Please enter both URL and name');
      return;
    }
    
    // Validate URL format
    try {
      new URL(newCustomUrl);
    } catch (_err) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setIsLoadingCustomUrl(true);
    setCustomUrlError(null);
    
    try {
      // Load the repository (it will be automatically saved)
      await loadCustomUrlRepository(newCustomUrl, newCustomUrlName);
      
      toast.success(`Added custom URL: ${newCustomUrlName}`);
      setNewCustomUrl('');
      setNewCustomUrlName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load custom URL';
      setCustomUrlError(message);
      toast.error(message);
    } finally {
      setIsLoadingCustomUrl(false);
    }
  };
  
  const handleRemoveCustomUrl = (url: string) => {
    storeRef.current.removeCustomUrl(url);
    toast.info('Custom URL removed');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              🔑 GitHub Personal Access Token Required
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              GitHub's Code Search API requires authentication. You'll need to create a Personal Access Token (PAT) to search for repositories.
            </p>
            <p className="text-sm text-blue-700">
              Status: {hasTokenState ? '✅ Token configured' : '❌ No token set'}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Personal Access Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showToken ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
              <p className="font-semibold text-gray-700 mb-2">How to create a GitHub Token:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</a></li>
                <li>Click "Generate new token (classic)"</li>
                <li>Give it a descriptive name (e.g., "Strudel Explorer")</li>
                <li>Select scopes: <strong>No scopes needed</strong> (public access only)</li>
                <li>Click "Generate token"</li>
                <li>Copy the token and paste it above</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">
                💡 The token is stored locally in your browser and never sent to any server except GitHub's API.
              </p>
            </div>
          </div>

          {/* Blocklist Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              🚫 Blocked Repositories ({blockedReposList.length})
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Blocked repositories are hidden from search results. These are typically non-Strudel repositories.
            </p>
            
            {blockedReposList.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600 text-center">
                No blocked repositories
              </div>
            ) : (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {blockedReposList.map((repoKey: string) => (
                    <div
                      key={repoKey}
                      className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100"
                    >
                      <span className="text-sm text-gray-700 font-mono truncate flex-1">
                        {repoKey}
                      </span>
                      <button
                        onClick={() => handleUnblock(repoKey)}
                        className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex-shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  {!showClearBlocklistConfirm ? (
                    <button
                      onClick={() => setShowClearBlocklistConfirm(true)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Clear All Blocked
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearBlocklist}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        ✓ Confirm Clear All
                      </button>
                      <button
                        onClick={() => setShowClearBlocklistConfirm(false)}
                        className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        ✗ Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Custom URLs Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              🔗 Custom URLs ({customUrlsList.length})
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add custom strudel.json URLs from any source, including localhost for development.
            </p>
            
            <form onSubmit={handleAddCustomUrl} className="mb-4 space-y-3">
              <div>
                <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Strudel JSON URL
                </label>
                <input
                  id="customUrl"
                  type="text"
                  value={newCustomUrl}
                  onChange={(e) => setNewCustomUrl(e.target.value)}
                  placeholder="https://example.com/strudel.json"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoadingCustomUrl}
                />
              </div>
              
              <div>
                <label htmlFor="customUrlName" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  id="customUrlName"
                  type="text"
                  value={newCustomUrlName}
                  onChange={(e) => setNewCustomUrlName(e.target.value)}
                  placeholder="My Custom Strudel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoadingCustomUrl}
                />
              </div>
              
              {customUrlError && (
                <div className="text-sm text-red-600">
                  Error: {customUrlError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoadingCustomUrl || !newCustomUrl.trim() || !newCustomUrlName.trim()}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingCustomUrl ? 'Loading...' : '➕ Add Custom URL'}
              </button>
            </form>
            
            {customUrlsList.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600 text-center">
                No custom URLs added
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                {customUrlsList.map((item) => (
                  <div
                    key={item.url}
                    className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100"
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate font-mono">
                        {item.url}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomUrl(item.url)}
                      className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={!token.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              💾 Save Token
            </button>
            {hasTokenState && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                🗑️ Clear Token
              </button>
            )}
            {showClearConfirm && (
              <>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  ✓ Confirm Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  ✗ Cancel
                </button>
              </>
            )}
            {!showClearConfirm && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}