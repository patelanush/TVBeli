import { SQLiteDatabase } from 'expo-sqlite';

import { LibraryStats, SavedShow, SavedShowStatus } from '@/types/savedShow';

type SavedShowRow = {
  tmdb_id: number;
  status: SavedShowStatus;
  personal_rating: number | null;
  review: string;
  rank_position: number | null;
  rated_at: string | null;
  created_at: string;
  updated_at: string;
};

const columns = `tmdb_id, status, personal_rating, review, rank_position,
  rated_at, created_at, updated_at`;

function fromRow(row: SavedShowRow): SavedShow {
  return {
    tmdbId: row.tmdb_id,
    status: row.status,
    personalRating: row.personal_rating,
    review: row.review,
    rankPosition: row.rank_position,
    ratedAt: row.rated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSavedShow(db: SQLiteDatabase, tmdbId: number) {
  const row = await db.getFirstAsync<SavedShowRow>(
    `SELECT ${columns} FROM saved_tv_shows WHERE tmdb_id = ?`,
    tmdbId,
  );
  return row ? fromRow(row) : null;
}

export async function getSavedShows(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<SavedShowRow>(
    `SELECT ${columns} FROM saved_tv_shows ORDER BY created_at DESC`,
  );
  return rows.map(fromRow);
}

export async function getRecentlyRatedShows(db: SQLiteDatabase, limit = 10) {
  const rows = await db.getAllAsync<SavedShowRow>(
    `SELECT ${columns} FROM saved_tv_shows
     WHERE personal_rating IS NOT NULL ORDER BY rated_at DESC LIMIT ?`,
    limit,
  );
  return rows.map(fromRow);
}

export async function getHighestRatedShows(db: SQLiteDatabase, limit = 10) {
  const rows = await db.getAllAsync<SavedShowRow>(
    `SELECT ${columns} FROM saved_tv_shows
     WHERE personal_rating IS NOT NULL
     ORDER BY personal_rating DESC, rated_at DESC LIMIT ?`,
    limit,
  );
  return rows.map(fromRow);
}

export async function saveShowStatus(db: SQLiteDatabase, tmdbId: number, status: SavedShowStatus) {
  await db.runAsync(
    `INSERT INTO saved_tv_shows (tmdb_id, status) VALUES (?, ?)
     ON CONFLICT(tmdb_id) DO UPDATE SET
       status = excluded.status,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    tmdbId,
    status,
  );
  return getSavedShow(db, tmdbId);
}

export async function saveRatingAndReview(
  db: SQLiteDatabase,
  tmdbId: number,
  personalRating: number | null,
  review: string,
) {
  const cleanReview = review.trim().slice(0, 500);
  await db.runAsync(
    `INSERT INTO saved_tv_shows
       (tmdb_id, status, personal_rating, review, rated_at)
     VALUES (?, 'watched', ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END)
     ON CONFLICT(tmdb_id) DO UPDATE SET
       personal_rating = excluded.personal_rating,
       review = excluded.review,
       rated_at = CASE
         WHEN excluded.personal_rating IS NULL THEN NULL
         WHEN saved_tv_shows.personal_rating IS excluded.personal_rating THEN saved_tv_shows.rated_at
         ELSE strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       END,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    tmdbId,
    personalRating,
    cleanReview,
    personalRating,
  );
  return getSavedShow(db, tmdbId);
}

export async function deleteSavedShow(db: SQLiteDatabase, tmdbId: number) {
  await db.runAsync('DELETE FROM saved_tv_shows WHERE tmdb_id = ?', tmdbId);
}

export async function getLibraryStats(db: SQLiteDatabase): Promise<LibraryStats> {
  const row = await db.getFirstAsync<{
    watched: number;
    watching: number;
    want_to_watch: number;
    average_rating: number | null;
  }>(`SELECT
      SUM(CASE WHEN status = 'watched' THEN 1 ELSE 0 END) AS watched,
      SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) AS watching,
      SUM(CASE WHEN status = 'want_to_watch' THEN 1 ELSE 0 END) AS want_to_watch,
      AVG(personal_rating) AS average_rating
    FROM saved_tv_shows`);

  return {
    watched: row?.watched ?? 0,
    watching: row?.watching ?? 0,
    wantToWatch: row?.want_to_watch ?? 0,
    averageRating: row?.average_rating ?? null,
  };
}
