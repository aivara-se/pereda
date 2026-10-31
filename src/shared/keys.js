// The four fixed keys, read the same way by the page and its tests. ⌘ on a
// Mac is Ctrl elsewhere; nothing here stores a combination or offers a setting.

// The action a keydown means, or null when it is not one of the four. Escape
// is reported wherever it is pressed; the page decides that only the search
// field acts on it.
export function keyAction(event, os) {
  if (event.key === 'Escape') return 'escape';
  const modifier = os === 'macos' ? event.metaKey : event.ctrlKey;
  if (!modifier || event.altKey || event.shiftKey) return null;
  switch (event.key.toLowerCase()) {
    case 'f':
      return 'search';
    case 't':
      return 'today';
    case 'arrowup':
      return 'previous';
    case 'arrowdown':
      return 'next';
    default:
      return null;
  }
}
