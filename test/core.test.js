import { test } from 'node:test';
import assert from 'node:assert/strict';

import { flatten, unflatten, DEFAULT_SEPARATOR } from '../src/core.js';

test('flatten turns a nested object into dot-separated keys', () => {
  const input = { a: { b: { c: 1 } }, d: 2 };
  assert.deepEqual(flatten(input), {
    'a.b.c': 1,
    'd': 2,
  });
});

test('unflatten reconstructs the original nested object', () => {
  const flat = { 'a.b.c': 1, 'd': 2 };
  assert.deepEqual(unflatten(flat), { a: { b: { c: 1 } }, d: 2 });
});

test('flatten and unflatten are inverses for a mixed object', () => {
  const original = {
    server: { host: 'localhost', port: 8080 },
    debug: true,
    features: { auth: { enabled: false, timeout: 30 } },
  };
  const flat = flatten(original);
  assert.deepEqual(unflatten(flat), original);
});

test('custom separator is respected in both directions', () => {
  const original = { a: { b: 1 } };
  const flat = flatten(original, { separator: '/' });
  assert.deepEqual(flat, { 'a/b': 1 });
  assert.deepEqual(unflatten(flat, { separator: '/' }), original);
});

test('DEFAULT_SEPARATOR is a dot', () => {
  assert.equal(DEFAULT_SEPARATOR, '.');
});

test('arrays are treated as terminal values, not recursed into', () => {
  const input = { items: [1, 2, 3] };
  assert.deepEqual(flatten(input), { 'items': [1, 2, 3] });
});

test('flatten preserves null and undefined as terminal values', () => {
  const input = { a: null, b: undefined };
  assert.deepEqual(flatten(input), { 'a': null, 'b': undefined });
});

test('flatten preserves Date instances without recursing', () => {
  const d = new Date(0);
  const input = { created: d };
  const flat = flatten(input);
  assert.equal(flat['created'], d);
});

test('flatten handles empty nested objects by preserving them', () => {
  const input = { a: { b: {} }, c: 1 };
  assert.deepEqual(flatten(input), { 'a.b': {}, 'c': 1 });
});

test('unflatten handles an empty input object', () => {
  assert.deepEqual(unflatten({}), {});
});

test('flatten throws TypeError for non-object input', () => {
  assert.throws(() => flatten(null), TypeError);
  assert.throws(() => flatten('string'), TypeError);
  assert.throws(() => flatten(42), TypeError);
});

test('unflatten throws TypeError for non-object input', () => {
  assert.throws(() => unflatten(null), TypeError);
  assert.throws(() => unflatten([]), TypeError);
});

test('flatten throws TypeError for empty separator', () => {
  assert.throws(() => flatten({}, { separator: '' }), TypeError);
});

test('flatten does not mutate the input', () => {
  const input = { a: { b: 1 } };
  const snapshot = JSON.parse(JSON.stringify(input));
  flatten(input);
  assert.deepEqual(input, snapshot);
});

test('unflatten does not mutate the input', () => {
  const input = { 'a.b': 1 };
  const snapshot = { 'a.b': 1 };
  unflatten(input);
  assert.deepEqual(input, snapshot);
});

test('objects with null prototype are treated as plain objects', () => {
  const dict = Object.create(null);
  dict.a = { b: 1 };
  const flat = flatten(dict);
  assert.deepEqual(flat, { 'a.b': 1 });
});

test('unflatten with conflicting keys lets the last key win', () => {
  // { 'a': 1, 'a.b': 2 } — 'a' is set to a number, then 'a.b' needs
  // 'a' to be an object, so the scalar is replaced.
  const flat = { 'a': 1, 'a.b': 2 };
  assert.deepEqual(unflatten(flat), { a: { b: 2 } });
});
