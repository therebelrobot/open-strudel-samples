import type { ExportData, LoadedRepository } from '../types/strudel';

const EXPORT_VERSION = '2.0';

/**
 * Export loaded repositories and blocklist to JSON
 */
export function exportToJson(repositories: LoadedRepository[], blocklist: string[] = []): string {
  const data: ExportData = {
    version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    repositories,
    blocklist,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Download export data as JSON file
 */
export function downloadExport(repositories: LoadedRepository[], blocklist: string[] = []): void {
  const json = exportToJson(repositories, blocklist);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `strudel-sounds-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse imported JSON data
 */
export function parseImportData(json: string): ExportData {
  try {
    const data = JSON.parse(json);

    if (!data.version || !data.repositories || !Array.isArray(data.repositories)) {
      throw new Error('Invalid export data format');
    }

    // Ensure blocklist is an array (backwards compatibility with v1.0)
    if (!data.blocklist) {
      data.blocklist = [];
    }

    return data as ExportData;
  } catch (error) {
    throw new Error(
      `Failed to parse import data: ${error instanceof Error ? error.message : 'Invalid JSON'
      }`
    );
  }
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import from JSON file
 */
export async function importFromFile(file: File): Promise<ExportData> {
  const text = await readFileAsText(file);
  return parseImportData(text);
}