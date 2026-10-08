/**
 * Public entry point for the flatten-dict library.
 *
 * Re-exports the two core operations so callers can do:
 *   import { flatten, unflatten } from 'flatten-dict';
 *
 * Keeping this file thin means the implementation can evolve
 * (splitting into more modules) without breaking import paths.
 */
export { flatten, unflatten } from './core.js';
