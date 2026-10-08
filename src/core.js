/**
 * Core implementation of dictionary flattening and unflattening.
 *
 * Design decisions (stated plainly so the behaviour is predictable):
 *
 * 1. Only plain objects are recursed into. Arrays are treated as
 *    terminal values, not as containers to flatten. This keeps the
 *    library focused on the "config object" use-case where list
 *    indices are not meant to become key segments. Callers who want
 *    arrays flattened can map over them first.
 *
 * 2. The separator is a user-supplied string so callers can pick a
 *    character that does not collide with their keys. We do not
 *    attempt to escape the separator inside keys; doing so reliably
 *    in both directions is fragile and out of scope. The README
 *    documents this limitation.
 *
 * 3. null, undefined, booleans, numbers, strings, BigInt, Date, etc.
 *    are all treated as terminal values and left untouched.
 */

/**
 * @typedef {(value: unknown) => boolean} IsPlainObject
 */

/**
 * Internal helper: decide whether a value should be recursed into.
 *
 * We check the prototype chain explicitly rather than using
 * `typeof value === 'object'` because that would also match arrays,
 * `null`, and class instances — all of which we want to treat as
 * terminal values.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  // `Object.create(null)` has proto === null; we want to treat that
  // as a plain object too, since it is a common pattern for dicts.
  return proto === null || proto === Object.prototype;
}

/**
 * Default separator used when none is provided.
 */
export const DEFAULT_SEPARATOR = '.';

/**
 * Flatten a nested dictionary into a single-level object whose keys
 * are the joined path segments.
 *
 * @param {Record<string, unknown>} dict - The object to flatten.
 * @param {object} [options]
 * @param {string} [options.separator='.'] - String inserted between
 *   path segments. Must be a non-empty string.
 * @returns {Record<string, unknown>} A new flat object. The input is
 *   not mutated.
 * @throws {TypeError} If `dict` is not a plain object.
 * @throws {TypeError} If `separator` is not a non-empty string.
 */
export function flatten(dict, options) {
  if (!isPlainObject(dict)) {
    throw new TypeError('flatten() expects a plain object');
  }

  const separator = options && options.separator !== undefined
    ? options.separator
    : DEFAULT_SEPARATOR;

  if (typeof separator !== 'string' || separator.length === 0) {
    throw new TypeError('separator must be a non-empty string');
  }

  /** @type {Record<string, unknown>} */
  const result = {};

  /**
   * Recursive worker. We carry an array of segments rather than a
   * pre-joined string so we never have to split/join redundantly.
   *
   * @param {unknown} current
   * @param {string[]} segments
   * @returns {void}
   */
  function walk(current, segments) {
    if (isPlainObject(current)) {
      const keys = Object.keys(current);
      if (keys.length === 0) {
        // Preserve empty objects as terminal values so unflatten can
        // restore them. Without this, an empty object would vanish.
        if (segments.length > 0) {
          result[segments.join(separator)] = {};
        }
        return;
      }
      for (const key of keys) {
        walk(current[key], [...segments, key]);
      }
      return;
    }

    // Terminal value.
    if (segments.length === 0) {
      // The root itself was a non-object; nothing meaningful to emit.
      return;
    }
    result[segments.join(separator)] = current;
  }

  walk(dict, []);
  return result;
}

/**
 * Reconstruct a nested object from a flat dictionary whose keys use
 * the given separator.
 *
 * @param {Record<string, unknown>} flatDict - The flat object to
 *   expand.
 * @param {object} [options]
 * @param {string} [options.separator='.'] - Separator that was used
 *   during flattening. Must match what flatten() was called with.
 * @returns {Record<string, unknown>} A new nested object.
 * @throws {TypeError} If `flatDict` is not a plain object.
 * @throws {TypeError} If `separator` is not a non-empty string.
 */
export function unflatten(flatDict, options) {
  if (!isPlainObject(flatDict)) {
    throw new TypeError('unflatten() expects a plain object');
  }

  const separator = options && options.separator !== undefined
    ? options.separator
    : DEFAULT_SEPARATOR;

  if (typeof separator !== 'string' || separator.length === 0) {
    throw new TypeError('separator must be a non-empty string');
  }

  /** @type {Record<string, unknown>} */
  const result = {};

  for (const key of Object.keys(flatDict)) {
    const value = flatDict[key];
    const segments = key.split(separator);

    // Walk down the path, creating plain objects as needed.
    let cursor = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const next = cursor[segment];
      if (!isPlainObject(next)) {
        // Overwrite non-objects (or missing slots) with a fresh dict.
        // This mirrors how most flatten/unflatten pairs behave: the
        // last write wins, and we trust the input is self-consistent.
        const fresh = {};
        cursor[segment] = fresh;
        cursor = fresh;
      } else {
        cursor = next;
      }
    }

    cursor[segments[segments.length - 1]] = value;
  }

  return result;
}
