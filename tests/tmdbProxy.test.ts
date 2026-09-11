import assert from 'node:assert/strict';
import test from 'node:test';

import handler from '../api/tmdb';

function responseRecorder() {
  let statusCode = 200;
  let body: unknown;
  const headers = new Map<string, string>();
  const response = {
    status(code: number) { statusCode = code; return response; },
    setHeader(name: string, value: string) { headers.set(name, value); },
    json(value: unknown) { body = value; },
  };
  return { response, result: () => ({ statusCode, body, headers }) };
}

test('TMDB proxy rejects non-TV endpoints before making a request', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response(); };
  const recorder = responseRecorder();
  await handler({ method: 'GET', query: { path: '/movie/popular' } }, recorder.response);
  globalThis.fetch = originalFetch;
  assert.equal(recorder.result().statusCode, 400);
  assert.equal(called, false);
});

test('TMDB proxy forwards only allowlisted query parameters with the server token', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.TMDB_READ_ACCESS_TOKEN;
  process.env.TMDB_READ_ACCESS_TOKEN = 'server-test-token';
  let requestedUrl = '';
  let authorization = '';
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = String(new Headers(init?.headers).get('authorization'));
    return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const recorder = responseRecorder();
  await handler({ method: 'GET', query: { path: '/search/tv', query: 'Severance', page: '1', forbidden: 'secret' } }, recorder.response);
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN;
  else process.env.TMDB_READ_ACCESS_TOKEN = originalToken;
  assert.equal(recorder.result().statusCode, 200);
  assert.match(requestedUrl, /\/search\/tv\?/);
  assert.match(requestedUrl, /query=Severance/);
  assert.doesNotMatch(requestedUrl, /forbidden/);
  assert.equal(authorization, 'Bearer server-test-token');
});
