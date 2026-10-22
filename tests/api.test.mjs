import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  login, register, getActivities, getAdminUsers, saveRisk, getAIAnalysis,
  createAdminUser, updateAdminUser, deleteAdminUser, SESSION_EXPIRED_EVENT,
  getRiskAssessments,
} from '../src/api.js';

let expirations;
let requests;
let responseStatus;
let respond;

beforeEach(() => {
  const storage = new Map([['token', 'current-token']]);
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  globalThis.window = new EventTarget();
  expirations = 0;
  requests = [];
  responseStatus = 200;
  window.addEventListener(SESSION_EXPIRED_EVENT, () => expirations++);
  respond = () => Promise.resolve(new Response(JSON.stringify({ success: responseStatus === 200 }), { status: responseStatus }));
  globalThis.fetch = (url, options) => {
    requests.push({ url, ...options });
    return respond();
  };
});

test('protected endpoints signal a rejected session and retain request data', async () => {
  responseStatus = 401;
  await getActivities();
  await getAdminUsers();
  await saveRisk({ title: 'Test assessment' });
  await getAIAnalysis({ totals: {} });
  await createAdminUser({ name: 'Test' });
  await updateAdminUser(12, { name: 'Updated' });
  await deleteAdminUser(12);
  assert.equal(expirations, 7);
  assert.ok(requests.every(request => request.headers.Authorization === 'Bearer current-token'));
  assert.equal(requests[2].method, 'POST');
  assert.deepEqual(JSON.parse(requests[2].body), { title: 'Test assessment' });
  assert.equal(requests[5].url, '/api/admin/users/12');
  assert.equal(requests[5].method, 'PUT');
  assert.equal(requests[6].method, 'DELETE');
});

test('wrong login credentials and registration failures do not expire an existing session', async () => {
  responseStatus = 401;
  await login('test@example.com', 'incorrect');
  await register('Test', 'test@example.com', 'incorrect');
  assert.equal(expirations, 0);
  assert.ok(requests.every(request => !request.headers.Authorization));
});

test('forbidden, server errors, and successful requests keep the session', async () => {
  for (const status of [200, 403, 500, 503]) {
    responseStatus = status;
    await getActivities();
  }
  assert.equal(expirations, 0);
});

test('an old request cannot invalidate a newly signed-in session', async () => {
  let finish;
  respond = () => new Promise(resolve => { finish = resolve; });
  const pending = getActivities();
  localStorage.setItem('token', 'new-session');
  finish(new Response(JSON.stringify({ success: false }), { status: 401 }));
  await pending;
  assert.equal(expirations, 0);
  assert.equal(localStorage.getItem('token'), 'new-session');
});

test('a missing session still offers reauthentication on protected requests', async () => {
  localStorage.removeItem('token');
  responseStatus = 401;
  await getActivities();
  assert.equal(expirations, 1);
  assert.equal(requests[0].headers.Authorization, undefined);
});

test('network errors do not sign the user out', async () => {
  respond = () => Promise.reject(new TypeError('Failed to fetch'));
  await assert.rejects(getActivities(), TypeError);
  assert.equal(expirations, 0);
});

test('dashboard reads all pages of saved risks, including their current level and score', async () => {
  let page = 0;
  respond = () => Promise.resolve(new Response(JSON.stringify({
    success: true,
    data: [{ id: ++page, risk_level: page === 1 ? 'High' : 'Low', likelihood: page === 1 ? 3 : 1, impact: 5 }],
    pagination: { pages: 2 },
  })));
  const result = await getRiskAssessments();
  assert.equal(result.data.length, 2);
  assert.deepEqual(result.data.map(risk => risk.risk_level), ['High', 'Low']);
  assert.equal(requests[0].url, '/api/risks?limit=100&page=1');
  assert.equal(requests[1].url, '/api/risks?limit=100&page=2');
});

test('dashboard stops loading further pages when the session is rejected', async () => {
  responseStatus = 401;
  assert.equal((await getRiskAssessments()).success, false);
  assert.equal(requests.length, 1);
  assert.equal(expirations, 1);
});
