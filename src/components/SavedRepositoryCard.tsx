import { useState, useMemo } from 'react';
import { AiFillStar } from 'react-icons/ai';
import { useSoundStore } from '../store/soundStore';
import { useToast } from '../hooks/useToast';
import { SoundCard } from './SoundCard';
import { groupSoundsByCategory } from '../utils/sound-processor';
import type { LoadedRepository, Sound } from '../types/strudel';

interface SavedRepositoryCardProps {
  repository: LoadedRepository;
  onPlay: (sound: Sound) => void;
  onStop: () => void;
}

export function SavedRepositoryCard({ repository, onPlay, onStop }: SavedRepositoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const unsaveRepository = useSoundStore((state) => state.unsaveRepository);
  const getRepositoryKey = useSoundStore((state) => state.getRepositoryKey);
  const toast = useToast();

  const repoKey = getRepositoryKey(repository);

  const handleUnsave = () => {
    unsaveRepository(repoKey);
    toast.info(`Removed ${repository.owner}/${repository.repo} from saved library`);
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
    return groupSoundsByCategory(repository.sounds);
  }, [repository.sounds]);

  const repoUrl = `https://github.com/${repository.owner}/${repository.repo}`;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold text-sm truncate"
            >
              {repository.owner}/{repository.repo}
            </a>
          </div>
          
          <div className="mb-1.5 text-xs">
            <span className="text-gray-500">File: </span>
            <code className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
              {repository.path}
            </code>
          </div>
          
          <div className="bg-purple-50 px-2 py-1 rounded text-xs">
            <span className="text-purple-700 font-mono">samples('github:{repository.owner}/{repository.repo}')</span>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleUnsave}
            className="p-2 rounded transition-colors bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
            title="Remove from saved"
          >
            <AiFillStar className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap"
          >
            {isExpanded ? '▼ Hide' : '▶ Show'} ({repository.sounds.length})
          </button>
        </div>
      </div>

      {/* Collapsible Sound Categories */}
      {isExpanded && (
        <div className="mt-3 border-t pt-3">
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
        </div>
      )}
    </div>
  );
}