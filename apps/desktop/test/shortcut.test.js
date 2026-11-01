import { describe, expect, test } from 'bun:test';

import { shortcutNotice } from '../src/shared/shortcut.js';

describe('the shortcut', () => {
  test('says nothing in the status line once the system took the combination', () => {
    expect(shortcutNotice('macos', true)).toBe('');
    expect(shortcutNotice('windows', true)).toBe('');
    expect(shortcutNotice('linux', true)).toBe('');
  });

  test('names the combination the person would press, and says it once', () => {
    expect(shortcutNotice('macos', false)).toBe(
      'The shortcut ⌘⇧D is not available on this computer.',
    );
    expect(shortcutNotice('windows', false)).toBe(
      'The shortcut Ctrl+Shift+D is not available on this computer.',
    );
    expect(shortcutNotice('linux', false)).toBe(
      'The shortcut Ctrl+Shift+D is not available on this computer.',
    );
  });
});
