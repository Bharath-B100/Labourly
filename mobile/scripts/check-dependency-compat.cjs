const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

const xcode = require('xcode');
const requireFromXcode = createRequire(require.resolve('xcode'));
const xcodePackage = requireFromXcode('xcode/package.json');

// Xcode parser v3 depends on uuid. Keep the security override verified when
// that dependency is present; v4 no longer depends on uuid.
if (xcodePackage.dependencies?.uuid) {
  assert.equal(requireFromXcode('uuid/package.json').version, '11.1.1');
}

// iOS compilation is a separate native acceptance gate.
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
