import { describe, expect, test } from 'bun:test';

import { SHOW_DATA_FOLDER, fileMenus } from '../src/shared/menu.js';

describe('the data folder menu', () => {
  test('is one item in a File menu', () => {
    expect(fileMenus()).toEqual([
      {
        title: 'File',
        items: [{ id: SHOW_DATA_FOLDER, label: 'Show data folder' }],
      },
    ]);
  });
});
