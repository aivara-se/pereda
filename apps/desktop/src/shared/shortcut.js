// The app's one shortcut. The backend registers this id and combination at
// launch and the page hears presses on the same id, so both read them here
// rather than agree on two literals that can drift apart silently.

export const SHORTCUT_ID = 'today';
export const SHORTCUT_COMBO = 'cmd+shift+d';

// What the status line says once when the system did not give the app the
// combination, and nothing when it did. A Mac names ⌘⇧D; elsewhere cmd is Ctrl.
export function shortcutNotice(os, registered) {
  if (registered) return '';
  return os === 'macos'
    ? 'The shortcut ⌘⇧D is not available on this computer.'
    : 'The shortcut Ctrl+Shift+D is not available on this computer.';
}
