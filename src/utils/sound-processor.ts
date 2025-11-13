import type { StrudelJson, Sound } from '../types/strudel';

/**
 * Extract sounds from strudel.json content
 */
export function extractSounds(
  strudelJson: StrudelJson,
  owner: string,
  repo: string,
  filePath: string
): Sound[] {
  const sounds: Sound[] = [];

  // Get base URL if it exists (common in Strudel format)
  const baseUrl = strudelJson._base || '';

  // Helper function to resolve URL
  const resolveUrl = (url: string): string => {
    // If URL is already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If we have a base URL, append the relative URL
    if (baseUrl) {
      return baseUrl + url;
    }
    // Otherwise return as-is
    return url;
  };

  // Check for nested structure first (sounds/samples keys)
  const soundsData = strudelJson.sounds || strudelJson.samples;

  if (soundsData && typeof soundsData === 'object') {
    // Nested structure: { sounds: { category: "url" } }
    Object.entries(soundsData).forEach(([category, urls]) => {
      const urlArray = Array.isArray(urls) ? urls : [urls];

      urlArray.forEach((url, index) => {
        if (typeof url === 'string' && url.trim()) {
          const soundId = `${owner}/${repo}/${category}/${index}`;

          sounds.push({
            id: soundId,
            name: `${category}${urlArray.length > 1 ? `-${index + 1}` : ''}`,
            url: resolveUrl(url.trim()),
            category,
            repository: `${owner}/${repo}`,
            owner,
            path: filePath,
          });
        }
      });
    });
  } else {
    // Flat structure: { _base: "url", key1: "path", key2: ["path1", "path2"] }
    Object.entries(strudelJson).forEach(([key, value]) => {
      // Skip special keys
      if (key === '_base' || key.startsWith('_')) {
        return;
      }

      const urlArray = Array.isArray(value) ? value : [value];

      urlArray.forEach((url, index) => {
        if (typeof url === 'string' && url.trim()) {
          const soundId = `${owner}/${repo}/${key}/${index}`;

          sounds.push({
            id: soundId,
            name: `${key}${urlArray.length > 1 ? `-${index + 1}` : ''}`,
            url: resolveUrl(url.trim()),
            category: key,
            repository: `${owner}/${repo}`,
            owner,
            path: filePath,
          });
        }
      });
    });
  }

  return sounds;
}

/**
 * Validate if a sound URL is valid
 */
export function isValidSoundUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const lastDot = pathname.lastIndexOf('.');

    if (lastDot === -1) return '';

    return pathname.substring(lastDot + 1).toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Check if URL points to an audio file
 */
export function isAudioFile(url: string): boolean {
  const extension = getFileExtension(url);
  const audioExtensions = ['wav', 'mp3', 'ogg', 'flac', 'aac', 'm4a', 'webm'];

  return audioExtensions.includes(extension);
}

/**
 * Group sounds by category
 */
export function groupSoundsByCategory(sounds: Sound[]): Record<string, Sound[]> {
  return sounds.reduce((acc, sound) => {
    const category = sound.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(sound);
    return acc;
  }, {} as Record<string, Sound[]>);
}

/**
 * Filter sounds by search query
 */
export function filterSounds(sounds: Sound[], query: string): Sound[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return sounds;

  return sounds.filter(sound =>
    sound.name.toLowerCase().includes(lowerQuery) ||
    sound.category?.toLowerCase().includes(lowerQuery) ||
    sound.repository.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort sounds by various criteria
 */
export function sortSounds(
  sounds: Sound[],
  sortBy: 'name' | 'category' | 'repository' = 'name'
): Sound[] {
  return [...sounds].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'repository':
        return a.repository.localeCompare(b.repository);
      default:
        return 0;
    }
  });
}