import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { createEmptyLibrary } from '../cloud/libraryState';

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const rulesSource = readFileSync('firestore.rules', 'utf8');
const ownerUid = rulesSource.match(/request\.auth\.uid == '([^']+)'/)?.[1] ?? 'REPLACE_WITH_FIREBASE_OWNER_UID';
let environment: RulesTestEnvironment | null = null;

async function getEnvironment() {
  environment ??= await initializeTestEnvironment({
    projectId: 'tvbeli-rules-test',
    firestore: { rules: rulesSource },
  });
  return environment;
}

test('Firestore rules allow only the configured owner', { skip: !emulatorAvailable }, async () => {
  const env = await getEnvironment();
  const owner = env.authenticatedContext(ownerUid).firestore();
  const stranger = env.authenticatedContext('someone-else').firestore();
  await assertSucceeds(setDoc(doc(owner, 'tvbeliLibraries', ownerUid), createEmptyLibrary('2026-09-10T00:00:00.000Z')));
  await assertSucceeds(getDoc(doc(owner, 'tvbeliLibraries', ownerUid)));
  await assertFails(getDoc(doc(stranger, 'tvbeliLibraries', ownerUid)));
});

test('Firestore rules enforce monotonic document revisions', { skip: !emulatorAvailable }, async () => {
  const env = await getEnvironment();
  const owner = env.authenticatedContext(ownerUid).firestore();
  const reference = doc(owner, 'tvbeliLibraries', ownerUid);
  const next = { ...createEmptyLibrary('2026-09-10T00:00:01.000Z'), documentVersion: 1 };
  await assertSucceeds(setDoc(reference, next));
  await assertFails(setDoc(reference, { ...next, updatedAt: '2026-09-10T00:00:02.000Z' }));
  assert.equal((await getDoc(reference)).data()?.documentVersion, 1);
});

test.after(async () => {
  await environment?.cleanup();
});
