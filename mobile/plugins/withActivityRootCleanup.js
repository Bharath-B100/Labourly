const { withMainActivity } = require('expo/config-plugins');

const marker =
  '  // Labourly: detach the outgoing surface before deferred Expo cleanup.';
const cleanup = `${marker}
  private var detachReactRoot: (() -> Unit)? = null

  override fun onDestroy() {
    detachReactRoot?.invoke()
    detachReactRoot = null
    super.onDestroy()
  }

`;

function addRootCleanup(source) {
  if (source.includes(marker)) return source;
  const anchor = '  override fun onCreate(savedInstanceState: Bundle?) {';
  if (!source.includes(anchor))
    throw new Error('Unrecognized MainActivity template');
  const delegateAnchor = /fabricEnabled,?(\r?\n\s*)\)\{\}/;
  if (!delegateAnchor.test(source))
    throw new Error('Unrecognized React delegate template');
  return source
    .replace(anchor, cleanup + anchor)
    .replace(
      delegateAnchor,
      'fabricEnabled$1){ init { detachReactRoot = { reactDelegate?.unloadApp() } } }',
    );
}

module.exports = function withActivityRootCleanup(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kt') {
      throw new Error('Activity root cleanup requires Kotlin MainActivity');
    }
    config.modResults.contents = addRootCleanup(config.modResults.contents);
    return config;
  });
};
module.exports.addRootCleanup = addRootCleanup;
