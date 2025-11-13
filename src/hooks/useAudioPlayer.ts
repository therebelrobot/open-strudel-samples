import { useState, useCallback, useRef, useEffect } from 'react';
import { useSoundStore } from '../store/soundStore';

interface UseAudioPlayerResult {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (url: string, soundId: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
}

export function useAudioPlayer(): UseAudioPlayerResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSoundIdRef = useRef<string | null>(null);

  const setCurrentlyPlaying = useSoundStore((state) => state.setCurrentlyPlaying);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async (url: string, soundId: string) => {
    try {
      // If same sound is already playing, just resume
      if (currentSoundIdRef.current === soundId && audioRef.current && audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentlyPlaying(soundId);
        return;
      }

      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(url);
      audio.volume = volume;

      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentlyPlaying(null);
        currentSoundIdRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        currentSoundIdRef.current = null;
      });

      audioRef.current = audio;
      currentSoundIdRef.current = soundId;

      await audio.play();
      setIsPlaying(true);
      setCurrentlyPlaying(soundId);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      throw error;
    }
  }, [volume, setCurrentlyPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    }
  }, [setCurrentlyPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentlyPlaying(null);
      currentSoundIdRef.current = null;
    }
  }, [setCurrentlyPlaying]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    stop,
    setVolume,
    seek,
  };
}