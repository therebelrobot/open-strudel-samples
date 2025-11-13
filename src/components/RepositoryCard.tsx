import { useState, useMemo } from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { useSoundStore } from '../store/soundStore';
import { useToast } from '../hooks/useToast';
import { SoundCard } from './SoundCard';
import { groupSoundsByCategory } from '../utils/sound-processor';
import type { GitHubCodeSearchItem } from '../types/github';
import type { Sound } from '../types/strudel';

interface RepositoryCardProps {
  item: GitHubCodeSearchItem;
  onLoad: (item: GitHubCodeSearchItem) => void;
  onPlay: (sound: Sound) => void;
  onStop: () => void;
  isLoading?: boolean;
}

export function RepositoryCard({ item, onLoad, onPlay, onStop, isLoading = false }: RepositoryCardProps) {
  const { repository, path } = item;
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const blockRepository = useSoundStore((state) => state.blockRepository);
  const getPreviewRepository = useSoundStore((state) => state.getPreviewRepository);
  const saveRepository =  useSoundStore((state) => state.saveRepository);
  const unsaveRepository = useSoundStore((state) => state.unsaveRepository);
  const isSaved = useSoundStore((state) => state.isSaved);
  const toast = useToast();

  const [owner, repo] = repository.full_name.split('/');
  const repoKey = `${owner}/${repo}/${path}`;
  
  // Check if this repo is loaded in preview
  const previewRepo = getPreviewRepository(repoKey);
  const saved = isSaved(repoKey);
  
  const handleBlock = () => {
    blockRepository(repoKey);
    toast.info(`Blocked ${repository.full_name} - will be hidden from future searches`);
  };

  const handleToggleSave = () => {
    if (previewRepo) {
      if (saved) {
        unsaveRepository(repoKey);
      } else {
        saveRepository(previewRepo);
        toast.success('Repository saved!');
      }
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Group sounds by category
  const groupedSounds = useMemo(() => {
    if (!previewRepo) return {};
    return groupSoundsByCategory(previewRepo.sounds);
  }, [previewRepo]);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              className="w-5 h-5 rounded-full flex-shrink-0"
            />
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold text-sm truncate"
            >
              {repository.full_name}
            </a>
          </div>
          
          {repository.description && (
            <p className="text-xs text-gray-500 mb-1.5 line-clamp-1">
              {repository.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
            {repository.language && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {repository.language}
              </span>
            )}
            <span>⭐ {repository.stargazers_count}</span>
          </div>
          
          <div className="mb-1.5 text-xs">
            <span className="text-gray-500">File: </span>
            <code className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
              {path}
            </code>
          </div>
          
          <div className="bg-purple-50 px-2 py-1 rounded text-xs">
            <span className="text-purple-700 font-mono">samples('github:{owner}/{repo}')</span>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleBlock}
            className="px-2 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            title="Block this repository (not a Strudel repo)"
          >
            🚫
          </button>
          {previewRepo && (
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
          )}
          <button
            onClick={() => onLoad(item)}
            disabled={isLoading || !!previewRepo}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isLoading ? '⏳ Loading' : previewRepo ? '✓ Loaded' : '📥 Load'}
          </button>
        </div>
      </div>

      {/* Collapsible Preview Section */}
      {previewRepo && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2"
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            <span>Preview ({previewRepo.sounds.length} sounds)</span>
          </button>
          
          {isExpanded && (
            <div className="space-y-2">
              {Object.entries(groupedSounds).map(([category, sounds]) => {
                const isCategoryExpanded = expandedCategories.has(category);
                return (
                  <div key={category} className="bg-gray-50 rounded border border-gray-200">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{isCategoryExpanded ? '▼' : '▶'}</span>
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                          {category}
                        </span>
                        <span className="text-xs text-gray-500">({sounds.length})</span>
                      </div>
                    </button>
                    {isCategoryExpanded && (
                      <div className="p-2 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {sounds.map((sound) => (
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
        </div>
      )}
    </div>
  );
}