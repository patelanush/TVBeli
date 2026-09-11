import assert from 'node:assert/strict';
import test from 'node:test';

import { getFriendlyAuthError, isMobileBrowserEnvironment, SingleFlight } from '../services/authFlow';

test('mobile browsers use redirect while desktop browsers use popup', () => {
  assert.equal(isMobileBrowserEnvironment({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', maxTouchPoints: 5, width: 390 }), true);
  assert.equal(isMobileBrowserEnvironment({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Mobile)', maxTouchPoints: 5, width: 412 }), true);
  assert.equal(isMobileBrowserEnvironment({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', maxTouchPoints: 0, width: 1440 }), false);
});

test('single-flight guard invokes an in-progress sign-in only once', async () => {
  const coordinator = new SingleFlight();
  let invocations = 0;
  let finish!: () => void;
  const action = () => {
    invocations += 1;
    return new Promise<void>((resolve) => { finish = resolve; });
  };
  const first = coordinator.run(action);
  const second = coordinator.run(action);
  assert.equal(first, second);
  assert.equal(invocations, 1);
  finish();
  await first;
  await coordinator.run(async () => { invocations += 1; });
  assert.equal(invocations, 2);
});

test('cancelled popup requests are silent and other common errors are friendly', () => {
  assert.equal(getFriendlyAuthError({ code: 'auth/cancelled-popup-request', message: 'Firebase: raw error' }), null);
  assert.equal(getFriendlyAuthError({ code: 'auth/popup-closed-by-user' }), 'Google sign-in was cancelled. You can try again when you’re ready.');
  assert.doesNotMatch(getFriendlyAuthError(new Error('Firebase: Error (auth/internal-error).'))!, /Firebase:/);
});
