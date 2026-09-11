import type { PreferenceGroup } from '@/types/ranking';
import type { SavedShow } from '@/types/savedShow';

export const CLOUD_LIBRARY_SCHEMA_VERSION = 1;

export type CloudLibraryDocument = {
  schemaVersion: typeof CLOUD_LIBRARY_SCHEMA_VERSION;
  documentVersion: number;
  rankingRevision: number;
  nextGroupId: number;
  savedShows: Record<string, SavedShow>;
  rankingGroups: PreferenceGroup[];
  updatedAt: string;
};

