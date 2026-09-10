import { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_tv_shows (
        tmdb_id INTEGER PRIMARY KEY NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('watched', 'watching', 'want_to_watch')),
        personal_rating REAL CHECK (personal_rating IS NULL OR personal_rating BETWEEN 1.0 AND 10.0),
        review TEXT NOT NULL DEFAULT '' CHECK (length(review) <= 500),
        rank_position INTEGER CHECK (rank_position IS NULL OR rank_position >= 1),
        rated_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_saved_tv_shows_status ON saved_tv_shows(status);
      CREATE INDEX IF NOT EXISTS idx_saved_tv_shows_rating ON saved_tv_shows(personal_rating DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_tv_shows_rated_at ON saved_tv_shows(rated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_tv_shows_created_at ON saved_tv_shows(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_tv_shows_rank ON saved_tv_shows(rank_position);
    `);
  }

  if (currentVersion < DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }

  const table = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'saved_tv_shows'",
  );
  if (!table) throw new Error('The personal TV library database could not be initialized.');

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(saved_tv_shows)');
  const expectedColumns = ['tmdb_id', 'status', 'personal_rating', 'review', 'rank_position', 'rated_at', 'created_at', 'updated_at'];
  const availableColumns = new Set(columns.map((column) => column.name));
  if (!expectedColumns.every((column) => availableColumns.has(column))) {
    throw new Error('The personal TV library database schema is incomplete.');
  }
}
