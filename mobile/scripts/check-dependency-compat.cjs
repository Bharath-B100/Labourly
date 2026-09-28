const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

// xcode uses only the CommonJS uuid.v4() API. Keep this checked when updating
// the narrowly scoped security override; iOS compilation is a separate gate.
const xcode = require('xcode');
const requireFromXcode = createRequire(require.resolve('xcode'));
assert.equal(requireFromXcode('uuid/package.json').version, '11.1.1');
const project = xcode.project('synthetic.pbxproj');
project.hash = { project: { objects: {} } };
const ids = new Set();
for (let index = 0; index < 10_000; index++) {
  const id = project.generateUuid();
  assert.match(id, /^[A-F0-9]{24}$/);
  assert.equal(ids.has(id), false);
  ids.add(id);
}
console.log(
  'PASS: patched xcode dependency produces 10,000 unique valid project IDs.',
);
