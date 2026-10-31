// The assistant: what the menu calls it, what the app remembers, and the one
// instruction the on-device model is given beside the note itself.

export const ASSISTANT_PREF = 'assistant';
export const ASSISTANT_TOGGLE = 'assistant-toggle';
export const ASSISTANT_SUMMARISE = 'assistant-summarise';
export const ASSISTANT_EVENT = 'assistant:summarise';

export const ASSISTANT_INSTRUCTIONS =
  'Summarise this personal daily note in one short paragraph, in the language it is written in. Do not add a title or a preamble.';

// The app menu carries the assistant on macOS. `unsupported` removes it; a
// model that is `unavailable` keeps the switch and disables the action with
// the reason. The switch is the app's preference, not the notes database's.
export function assistantMenus(availability, enabled) {
  if (availability === 'unsupported') return [];
  const ready = availability === 'available';
  return [
    {
      role: 'app',
      items: [
        { id: ASSISTANT_TOGGLE, label: 'Assistant', checked: enabled },
        {
          id: ASSISTANT_SUMMARISE,
          label: ready
            ? 'Summarise this note'
            : `Summarise this note — ${assistantUnavailable(availability)}`,
          enabled: enabled && ready,
        },
      ],
    },
  ];
}

// What a refused action says. `unsupported` is normally absent from the menu,
// so this is the page's answer when a call arrives anyway.
export function assistantUnavailable(availability) {
  return availability === 'unavailable'
    ? 'Apple Intelligence is off or its model is still downloading.'
    : 'The assistant needs macOS 26 or later.';
}
