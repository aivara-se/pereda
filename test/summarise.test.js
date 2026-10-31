import { beforeAll, describe, expect, mock, test } from 'bun:test';

// The backend imports tjs:sqlite and tjs:path at the top; the summary handler
// never opens either, so a stub is enough to load the module under bun.
mock.module('tjs:sqlite', () => ({ Database: class {} }));
mock.module('tjs:path', () => ({ default: { join: (...parts) => parts.join('/') } }));

let api;

beforeAll(async () => {
  ({ api } = await import('../src/backend/main.js'));
});

function fakeApp({ availability = 'available', enabled = true, generate } = {}) {
  const calls = [];
  return {
    calls,
    system: { os: () => 'macos' },
    macos: {
      ai: {
        availability: async () => availability,
        generate: async (prompt, options) => {
          calls.push({ prompt, options });
          return generate === undefined ? 'A short summary.' : generate();
        },
      },
    },
    store: {
      get: async (key) => (key === 'assistant' ? enabled : null),
      set: async () => true,
    },
  };
}

describe('the summary request', () => {
  test('sends the note and the fixed instruction, and returns the reply', async () => {
    const app = fakeApp();
    await expect(api.summariseNote({ body: 'The note on screen.' }, app)).resolves.toEqual({
      text: 'A short summary.',
    });
    expect(app.calls).toHaveLength(1);
    expect(app.calls[0].prompt).toBe('The note on screen.');
    expect(app.calls[0].options.instructions).toContain('Summarise');
  });

  test('refuses a second request while the first is still answering', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const app = fakeApp({
      generate: async () => {
        await gate;
        return 'A short summary.';
      },
    });
    const first = api.summariseNote({ body: 'One note.' }, app);
    await expect(api.summariseNote({ body: 'Another note.' }, app)).rejects.toThrow(
      'still answering the last note',
    );
    release();
    await expect(first).resolves.toEqual({ text: 'A short summary.' });
  });

  test('refuses when the assistant is off or the model is not ready', async () => {
    await expect(api.summariseNote({ body: 'A note.' }, fakeApp({ enabled: false }))).rejects.toThrow(
      'The assistant is off.',
    );
    await expect(
      api.summariseNote({ body: 'A note.' }, fakeApp({ availability: 'unavailable' })),
    ).rejects.toThrow('Apple Intelligence is off or its model is still downloading.');
    await expect(
      api.summariseNote({ body: 'A note.' }, fakeApp({ availability: 'unsupported' })),
    ).rejects.toThrow('The assistant needs macOS 26 or later.');
  });

  test('refuses an empty note before it reaches the model', async () => {
    const app = fakeApp();
    await expect(api.summariseNote({ body: '   ' }, app)).rejects.toThrow(
      'There is nothing to summarise.',
    );
    expect(app.calls).toHaveLength(0);
  });
});
