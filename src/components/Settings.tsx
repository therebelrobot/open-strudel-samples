import { useState, useEffect, useRef } from 'react';
import { setGitHubToken, clearGitHubToken, hasGitHubToken } from '../utils/github-api';
import { useToast } from '../hooks/useToast';
import { useSoundStore } from '../store/soundStore';

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
  
  // Refs to store functions without causing re-renders
  const storeRef = useRef({
    unblockRepository: (key: string) => {},
    clearBlocklist: () => {}
  });
  
  const toast = useToast();
  
  // Initialize state on mount only
  useEffect(() => {
    // Check if token exists
    setHasTokenState(hasGitHubToken());
    
    // Get store functions
    const store = useSoundStore.getState();
    storeRef.current = {
      unblockRepository: store.unblockRepository,
      clearBlocklist: store.clearBlocklist
    };
    
    // Get blocked repos
    setBlockedReposList(store.getBlockedRepos());
    
    // Subscribe to blockedRepos changes
    const unsubscribe = useSoundStore.subscribe(
      (state) => {
        // When blockedRepos changes, update our local state
        setBlockedReposList(state.getBlockedRepos());
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