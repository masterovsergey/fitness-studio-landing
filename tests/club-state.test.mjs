import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, restoreState, buildSessions, products, activeBooking, eligiblePasses, buyDemoPass, bookDemoSession, cancelDemoSession, visitLabel } from '../public/club/data.js';

const anchor = '2026-09-07';
const now = new Date(2026, 8, 7, 12).getTime();
const sessions = buildSessions(anchor);
const group = sessions.find((s) => s.category === 'strength');
const personal = sessions.find((s) => s.category === 'personal');

test('demo schedule has six active days, an empty day, and full classes', () => {
  assert.ok(sessions.length > 20);
  assert.equal(sessions.filter((s) => s.day === 6).length, 0);
  assert.ok(sessions.some((s) => s.seats === 0));
  assert.equal(new Set(sessions.map((s) => s.id)).size, sessions.length);
});
test('single session booking cannot be duplicated or made into a full group', () => {
  const state = initialState(anchor);
  const booked = bookDemoSession(state, group.id, null, now);
  assert.ok(activeBooking(booked.state, group.id));
  assert.equal(booked.state.passes.length, 0);
  assert.ok(bookDemoSession(booked.state, group.id, null, now).error);
  assert.ok(bookDemoSession(state, sessions.find((s) => s.seats === 0).id, null, now).error);
  assert.ok(bookDemoSession(state, 'missing', null, now).error);
  assert.equal(state.bookings.length, 0, 'state is not mutated');
});
test('demo package debit, cancellation credit, and rebooking work exactly once', () => {
  const bought = buyDemoPass(initialState(anchor), 'rhythm', 'pass-1', now).state;
  assert.equal(bought.passes[0].remaining, 8);
  const booked = bookDemoSession(bought, group.id, 'pass-1', now).state;
  assert.equal(booked.passes[0].remaining, 7);
  assert.equal(bought.passes[0].remaining, 8);
  const cancelled = cancelDemoSession(booked, group.id).state;
  assert.equal(cancelled.passes[0].remaining, 8);
  assert.equal(activeBooking(cancelled, group.id), undefined);
  assert.ok(cancelDemoSession(cancelled, group.id).error);
  const rebooked = bookDemoSession(cancelled, group.id, 'pass-1', now).state;
  assert.equal(rebooked.bookings.length, 1);
  assert.equal(rebooked.passes[0].remaining, 7);
});
test('wrong, exhausted and expired packages cannot be used', () => {
  const groupPass = buyDemoPass(initialState(anchor), 'intro', 'pass-1', now).state;
  assert.ok(bookDemoSession(groupPass, personal.id, 'pass-1', now).error);
  assert.ok(bookDemoSession(groupPass, group.id, 'missing', now).error);
  assert.equal(eligiblePasses(groupPass, group, now + 15 * 86400000).length, 0);
  const exhausted = { ...groupPass, passes: [{ ...groupPass.passes[0], remaining: 0 }] };
  assert.ok(bookDemoSession(exhausted, group.id, 'pass-1', now).error);
  const privatePass = buyDemoPass(initialState(anchor), 'personal', 'pass-2', now).state;
  assert.equal(bookDemoSession(privatePass, personal.id, 'pass-2', now).state.passes[0].remaining, 0);
});
test('purchases reject invalid products and duplicate identifiers', () => {
  const state = initialState(anchor);
  assert.ok(buyDemoPass(state, 'not-a-product', 'p1', now).error);
  const bought = buyDemoPass(state, products[0].id, 'p1', now).state;
  assert.ok(buyDemoPass(bought, products[0].id, 'p1', now).error);
});
test('storage roundtrip keeps demo state and drops arbitrary user-supplied properties', () => {
  let state = buyDemoPass(initialState(anchor), 'rhythm', 'pass-1', now).state;
  state = bookDemoSession(state, group.id, 'pass-1', now).state;
  assert.deepEqual(restoreState(JSON.stringify(state), anchor), state);
  assert.deepEqual(restoreState('{bad-json', anchor), initialState(anchor));
  assert.deepEqual(restoreState('{"version":1,"anchor":"2026-99-99"}', anchor), initialState(anchor));
  const sanitized = restoreState(JSON.stringify({ ...state, phone: 'do-not-store', name: '<script>', passes: [...state.passes, { id: 'bad', product: 'rhythm', remaining: -1, created: now }] }), anchor);
  assert.deepEqual(sanitized, state);
});
test('invalid saved creation and expiry dates cannot break profile rendering', () => {
  for (const created of [1e100, -1, 8640000000000000 - 1, null, '2026-09-07']) {
    const state = { ...initialState(anchor), passes: [{ id: 'p1', product: 'rhythm', remaining: 8, created }] };
    assert.equal(restoreState(JSON.stringify(state), anchor).passes.length, 0);
  }
});
test('visit labels use Russian plural forms', () => {
  assert.equal(visitLabel(1), '1 посещение'); assert.equal(visitLabel(2), '2 посещения');
  assert.equal(visitLabel(8), '8 посещений'); assert.equal(visitLabel(12), '12 посещений');
});
