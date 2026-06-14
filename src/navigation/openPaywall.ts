/**
 * Open the Paywall.
 *
 * Paywall is registered as a ROOT-level modal (see RootNavigator), so calling
 * navigate('Paywall') from any nested screen bubbles up the navigator tree and
 * presents it as an overlay over the current tab — no jarring jump to the
 * Profile tab (QA M3). Centralised here so every entry point behaves identically
 * and no screen needs fragile getParent() chains.
 *
 * `navigation` is intentionally loosely typed: callers pass navigation props
 * from many different stacks, and 'Paywall' is resolved by tree-bubbling rather
 * than by any single stack's param list.
 */
 
export function openPaywall(navigation: any): void {
  navigation.navigate('Paywall');
}
