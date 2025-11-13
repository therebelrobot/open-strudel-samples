export interface StrudelJson {
  sounds?: Record<string, string | string[]>;
  samples?: Record<string, string | string[]>;
  [key: string]: any;
}

export interface Sound {
  id: string;
  name: string;
  url: string;
  category?: string;
  repository: string;
  owner: string;
  path: string;
}

export interface LoadedRepository {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  strudel_json_url: string;
  raw_json_url: string;
  sounds: Sound[];
  loaded_at: string;
}

export interface ExportData {
  version: string;
  exported_at: string;
  repositories: LoadedRepository[];
  blocklist?: string[];
}