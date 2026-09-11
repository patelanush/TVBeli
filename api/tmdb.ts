type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

const TMDB_BASE = 'https://api.themoviedb.org/3';
const ALLOWED_PATHS = [
  /^\/trending\/tv\/week$/,
  /^\/tv\/(popular|top_rated)$/,
  /^\/search\/tv$/,
  /^\/genre\/tv\/list$/,
  /^\/tv\/\d+$/,
];
const ALLOWED_PARAMS = new Set(['language', 'page', 'query', 'include_adult', 'append_to_response']);

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const path = one(request.query.path);
  if (!path || !ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    response.status(400).json({ error: 'Unsupported TMDB endpoint.' });
    return;
  }
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) {
    response.status(500).json({ error: 'TMDB is not configured.' });
    return;
  }
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of Object.entries(request.query)) {
    if (key !== 'path' && ALLOWED_PARAMS.has(key)) {
      const normalized = one(value);
      if (normalized !== undefined) url.searchParams.set(key, normalized);
    }
  }
  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json', Authorization: `Bearer ${token}` } });
    const body = await upstream.json();
    response.setHeader('Cache-Control', path.startsWith('/search/') ? 'private, no-store' : 's-maxage=900, stale-while-revalidate=86400');
    response.status(upstream.status).json(body);
  } catch {
    response.status(502).json({ error: 'Unable to reach TMDB.' });
  }
}
