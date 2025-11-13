import { useState } from 'react';
import { useSoundStore } from '../store/soundStore';
import type { Sound } from '../types/strudel';

interface SoundCardProps {
  sound: Sound;
  onPlay: (sound: Sound) => void;
  onStop: () => void;
}

export function SoundCard({ sound, onPlay, onStop }: SoundCardProps) {
  const currentlyPlaying = useSoundStore((state) => state.currentlyPlaying);
  const isPlaying = currentlyPlaying === sound.id;
  const [showCode, setShowCode] = useState(false);

  const handleClick = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay(sound);
    }
  };

  // Extract repo parts for Strudel syntax
  const [owner, repo] = sound.repository.split('/');
  const soundIndexMatch = sound.name.match(/-(\d+)$/);
  const soundIndex = soundIndexMatch ? parseInt(soundIndexMatch[1]) - 1 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded hover:shadow-md transition-all">
      <div className="p-2 flex items-center gap-2">
        <button
          onClick={handleClick}
          className={`
            p-2 rounded-full transition-all flex-shrink-0
            ${isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
          `}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="4" width="3" height="12" />
              <rect x="11" y="4" width="3" height="12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-gray-800 truncate">
              {sound.name}
            </h3>
            {sound.category && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded flex-shrink-0">
                {sound.category}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-blue-600 hover:underline mt-0.5"
          >
            {showCode ? '▼' : '▶'} Strudel code
          </button>
        </div>
      </div>

      {showCode && (
        <div className="px-2 pb-2 pt-0 border-t border-gray-100 bg-gray-50 text-xs space-y-1">
          <div>
            <span className="text-gray-600">Use this pack:</span>
            <code className="block bg-gray-800 text-green-400 px-2 py-1 rounded mt-0.5 font-mono text-xs">
              samples('github:{owner}/{repo}')
            </code>
          </div>
          <div>
            <span className="text-gray-600">Use this sound:</span>
            <code className="block bg-gray-800 text-green-400 px-2 py-1 rounded mt-0.5 font-mono text-xs">
              s("{sound.category}:{soundIndex}")
            </code>
          </div>
        </div>
      )}
    </div>
  );
}