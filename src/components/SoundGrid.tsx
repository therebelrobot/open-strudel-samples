import { useState, useMemo } from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { SoundCard } from './SoundCard';
import { filterSounds, sortSounds, groupSoundsByCategory } from '../utils/sound-processor';
import { useSoundStore } from '../store/soundStore';
import type { Sound, LoadedRepository } from '../types/strudel';

interface SoundGridProps {
  sounds: Sound[];
  onPlay: (sound: Sound) => void;
  onStop: () => void;
  isPreview: boolean;
}

export function SoundGrid({ sounds, onPlay, onStop, isPreview }: SoundGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'repository'>('category');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const saveRepository = useSoundStore((state) => state.saveRepository);
  const unsaveRepository = useSoundStore((state) => state.unsaveRepository);
  const toggleCollapsed = useSoundStore((state) => state.toggleCollapsed);
  const isSaved = useSoundStore((state) => state.isSaved);
  const isCollapsed = useSoundStore((state) => state.isCollapsed);
  const previewRepositories = useSoundStore((state) => state.previewRepositories);
  const savedRepositories = useSoundStore((state) => state.savedRepositories);
  const getRepositoryKey = useSoundStore((state) => state.getRepositoryKey);
  const getPreviewRepository = useSoundStore((state) => state.getPreviewRepository);
  
  const loadedRepos = isPreview ? previewRepositories : savedRepositories;

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredSounds = useMemo(() => {
    const filtered = filterSounds(sounds, searchQuery);
    return sortSounds(filtered, sortBy);
  }, [sounds, searchQuery, sortBy]);

  const groupedSounds = useMemo(() => {
    return groupSoundsByCategory(filteredSounds);
  }, [filteredSounds]);

  const groupedByRepo = useMemo(() => {
    const grouped: Record<string, Sound[]> = {};
    filteredSounds.forEach(sound => {
      if (!grouped[sound.repository]) {
        grouped[sound.repository] = [];
      }
      grouped[sound.repository].push(sound);
    });
    return grouped;
  }, [filteredSounds]);

  if (sounds.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-lg font-semibold text-gray-800 mb-2">No sounds loaded yet</p>
        <p className="text-sm text-gray-600 mb-4">Search for repositories and load their sounds to get started</p>
        <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto text-sm">
          <p className="font-semibold text-gray-800 mb-2">💡 Quick Start:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Go to "Search GitHub" tab</li>
            <li>Click "Search" to find strudel.json files</li>
            <li>Click "Load Sounds" on any repository</li>
            <li>Come back here to explore and play sounds</li>
          </ol>
        </div>
      </div>
    );
  }

  // Get unique repositories for help text
  const uniqueRepoNames = Array.from(new Set(sounds.map(s => s.repository)));

  return (
    <div className="space-y-3">
      {/* Strudel Help Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-3 shadow-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎹</div>
          <div className="flex-1 text-sm">
            <p className="font-semibold mb-1">Using these sounds in Strudel:</p>
            <div className="space-y-1 text-purple-100">
              {uniqueRepoNames.slice(0, 2).map(repo => {
                const [owner, repoName] = repo.split('/');
                return (
                  <div key={repo}>
                    <code className="bg-purple-800 bg-opacity-50 px-2 py-0.5 rounded text-xs">
                      samples('github:{owner}/{repoName}')
                    </code>
                  </div>
                );
              })}
              {uniqueRepoNames.length > 2 && (
                <p className="text-xs">+ {uniqueRepoNames.length - 2} more repositories</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-3 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
          <input
            type="text"
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="repository">Repo</option>
            </select>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'grouped' : 'grid')}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {viewMode === 'grid' ? '🗂️' : '📋'}
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          {filteredSounds.length} sound{filteredSounds.length !== 1 ? 's' : ''} • {uniqueRepoNames.length} repo{uniqueRepoNames.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Sounds Display */}
      {viewMode === 'grid' ? (
        <div className="space-y-3">
          {Object.entries(groupedByRepo).map(([repo, repoSounds]) => {
            // Find the repository object to get its key
            const repoObj = loadedRepos.find((r: LoadedRepository) => `${r.owner}/${r.repo}` === repo);
            const repoKey = repoObj ? getRepositoryKey(repoObj) : repo;
            const collapsed = isCollapsed(repoKey);
            const saved = isSaved(repoKey);
            
            const handleToggleSave = () => {
              if (repoObj) {
                if (saved) {
                  unsaveRepository(repoKey);
                } else {
                  saveRepository(repoObj);
                }
              }
            };
            
            return (
              <div key={repo} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <button
                    onClick={() => toggleCollapsed(repoKey)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="text-lg">{collapsed ? '▶' : '▼'}</span>
                    <h3 className="text-base font-bold text-gray-800">
                      {repo}
                    </h3>
                    <span className="text-xs text-gray-500">({repoSounds.length})</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-600 font-mono hidden sm:block">
                      samples('github:{repo}')
                    </span>
                    <button
                      onClick={handleToggleSave}
                      className={`p-2 rounded transition-colors ${
                        saved
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={saved ? 'Remove from saved' : 'Save repository'}
                    >
                      {saved ? <AiFillStar className="w-5 h-5" /> : <AiOutlineStar className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {!collapsed && (
                  <div className="p-3 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {repoSounds.map((sound) => (
                        <SoundCard
                          key={sound.id}
                          sound={sound}
                          onPlay={onPlay}
                          onStop={onStop}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedSounds).map(([category, categorySounds]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isCollapsed ? '▶' : '▼'}</span>
                    <h3 className="text-base font-bold text-gray-800 capitalize">
                      {category}
                    </h3>
                    <span className="text-xs text-gray-500">({categorySounds.length})</span>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="p-3 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {categorySounds.map((sound) => (
                        <SoundCard
                          key={sound.id}
                          sound={sound}
                          onPlay={onPlay}
                          onStop={onStop}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredSounds.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
          <p>No sounds match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}