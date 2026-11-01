import { describe, expect, test } from 'bun:test';

import {
  ASSISTANT_SUMMARISE,
  ASSISTANT_TOGGLE,
  assistantMenus,
} from '../src/shared/assistant.js';

function items(availability, enabled) {
  const menus = assistantMenus(availability, enabled);
  return menus[0]?.items ?? [];
}

function item(availability, enabled, id) {
  return items(availability, enabled).find((entry) => entry.id === id);
}

describe('the assistant menu', () => {
  test('is absent where the model cannot exist', () => {
    expect(assistantMenus('unsupported', false)).toEqual([]);
    expect(assistantMenus('unsupported', true)).toEqual([]);
  });

  test('offers the action only with the switch on and the model available', () => {
    expect(item('available', true, ASSISTANT_SUMMARISE).enabled).toBe(true);
    expect(item('available', false, ASSISTANT_SUMMARISE).enabled).toBe(false);
  });

  test('disables the action with the reason while the model is unavailable', () => {
    expect(item('unavailable', true, ASSISTANT_SUMMARISE)).toEqual({
      id: ASSISTANT_SUMMARISE,
      label: 'Summarise this note — Apple Intelligence is off or its model is still downloading.',
      enabled: false,
    });
  });

  test('shows the switch as the preference, off until turned on', () => {
    expect(item('available', false, ASSISTANT_TOGGLE).checked).toBe(false);
    expect(item('available', true, ASSISTANT_TOGGLE).checked).toBe(true);
  });
});
