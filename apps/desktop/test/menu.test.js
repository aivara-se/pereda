import { beforeAll, describe, expect, mock, test } from 'bun:test';

// The backend imports tjs:sqlite and tjs:path at the top; init never opens
// either, so a stub is enough to load the module under bun.
mock.module('tjs:sqlite', () => ({ Database: class {} }));
mock.module('tjs:path', () => ({ default: { join: (...parts) => parts.join('/') } }));

let init;
let fileMenus;

beforeAll(async () => {
  ({ init } = await import('../src/backend/main.js'));
  ({ fileMenus } = await import('../src/shared/menu.js'));
});

describe('the menu at launch', () => {
  test('is the File menu and nothing else', async () => {
    const set = [];
    const app = {
      system: { capabilities: async () => ({ globalHotkeys: false }) },
      menu: {
        set: async (menus) => {
          set.push(menus);
        },
      },
    };
    await init(app);
    expect(set).toEqual([fileMenus()]);
  });
});
