import { describe, expect, test } from 'bun:test';

import { keyAction } from '../src/shared/keys.js';

function press(key, extra = {}) {
  return { key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...extra };
}

describe('the fixed keys', () => {
  test('take ⌘ on a Mac and Ctrl everywhere else', () => {
    expect(keyAction(press('f', { metaKey: true }), 'macos')).toBe('search');
    expect(keyAction(press('f', { ctrlKey: true }), 'windows')).toBe('search');
    expect(keyAction(press('f', { ctrlKey: true }), 'linux')).toBe('search');
    expect(keyAction(press('f', { ctrlKey: true }), 'macos')).toBeNull();
    expect(keyAction(press('f', { metaKey: true }), 'linux')).toBeNull();
  });

  test('are the four, and nothing else', () => {
    const cases = [
      ['f', 'search'],
      ['t', 'today'],
      ['ArrowUp', 'previous'],
      ['ArrowDown', 'next'],
    ];
    for (const [key, action] of cases) {
      expect([key, keyAction(press(key, { metaKey: true }), 'macos')]).toEqual([key, action]);
    }
    expect(keyAction(press('s', { metaKey: true }), 'macos')).toBeNull();
    expect(keyAction(press('f'), 'macos')).toBeNull();
  });

  test('ignore a third modifier', () => {
    expect(keyAction(press('f', { metaKey: true, altKey: true }), 'macos')).toBeNull();
    expect(keyAction(press('t', { metaKey: true, shiftKey: true }), 'macos')).toBeNull();
    expect(keyAction(press('ArrowUp', { metaKey: true, shiftKey: true }), 'macos')).toBeNull();
  });

  test('report Escape wherever it is pressed', () => {
    expect(keyAction(press('Escape'), 'macos')).toBe('escape');
    expect(keyAction(press('Escape', { ctrlKey: true }), 'linux')).toBe('escape');
  });
});
