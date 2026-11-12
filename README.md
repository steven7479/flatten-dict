# flatten-dict

Turn nested dictionaries into flat keys—and back—using any separator.

## Usage

```js
import { flatten, unflatten } from 'flatten-dict';

const nested = { server: { host: 'localhost', port: 8080 } };
const flat = flatten(nested);
// => { 'server.host': 'localhost', 'server.port': 8080 }

const back = unflatten(flat);
// => { server: { host: 'localhost', port: 8080 } }

// Custom separator:
flatten(nested, { separator: '/' });
// => { 'server/host': 'localhost', 'server/port': 8080 }
```

## Why

Config objects, environment-variable mappings, and URL query params
often need to move between a nested representation and a flat
key-value form. This library does exactly that, in both directions,
with a caller-chosen separator so you can avoid collisions with your
key names.

## Behaviour notes

- **Arrays are terminal.** `[1, 2, 3]` is kept as a value, not
  expanded into `key.0`, `key.1`, … If you need that, map first.
- **No separator escaping.** If a key itself contains the separator
  string, round-tripping will be ambiguous. Pick a separator that
does not appear in your keys.
- **Empty nested objects are preserved** as `{}` so they survive a
  round trip rather than vanishing.
- **`null`-prototype objects** (`Object.create(null)`) are treated as
  plain dictionaries.

## Exports

| Name                | Kind     | Description                              |
|---------------------|----------|------------------------------------------|
| `flatten`           | function | Nested object → flat keys.               |
| `unflatten`         | function | Flat keys → nested object.               |
| `DEFAULT_SEPARATOR` | string   | The default separator, `'.'`.            |

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

