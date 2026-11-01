// The assistant: the one instruction the on-device model is given beside the
// note itself, and what a refused request says.

export const ASSISTANT_INSTRUCTIONS =
  'Summarise this personal daily note in one short paragraph, in the language it is written in. Do not add a title or a preamble.';

// What a refused request says. `unsupported` is normally the platform without
// the model; the page shows either sentence in the status line.
export function assistantUnavailable(availability) {
  return availability === 'unavailable'
    ? 'Apple Intelligence is off or its model is still downloading.'
    : 'The assistant needs macOS 26 or later.';
}
