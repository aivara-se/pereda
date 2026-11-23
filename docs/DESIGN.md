# Design System

Pereda draws one window on the desktop and the same page in a browser. The values below are measured on the surface they are used on.

## Colours

| Token           | Light                      | Dark                        | Used for                                                      |
| --------------- | -------------------------- | --------------------------- | ------------------------------------------------------------- |
| `--bg`          | `#faf9f6`                  | `#121110`                   | the page's fill, the status line and the assistant panel      |
| `--window`      | `rgba(250, 249, 246, 0.8)` | `rgba(18, 17, 16, 0.8)`     | the window fill; the desktop reads through it                 |
| `--ink`         | `#26231f`                  | `#ece7dd`                   | note text, headings, the selected date, a control at strength |
| `--muted`       | `#7d756a`                  | `#958d80`                   | dates, placeholders, secondary lines, a control that waits    |
| `--icon`        | `#6a6155`                  | `#a79e90`                   | the bar's icons                                               |
| `--hover`       | `rgba(38, 35, 31, 0.06)`   | `rgba(236, 231, 221, 0.07)` | a control's hover wash and the code chip                      |
| `--accent`      | `#a9541c`                  | `#dda36c`                   | the caret, the text selection and the focus ring              |
| `--accent-soft` | `#f0e0cf`                  | `#2a231b`                   | the focused field's rule and a button's hover                 |
| `--error`       | `#a5342c`                  | `#e59a92`                   | a refusal or a failed save, never decoration                  |
| `--close`       | `#e0685c`                  | `#e0685c`                   | the window's close dot                                        |
| `--minimize`    | `#dfae52`                  | `#dfae52`                   | the window's minimize dot                                     |
| `--zoom`        | `#6fb073`                  | `#6fb073`                   | the window's zoom dot                                         |

State is never signalled by colour alone: a refusal is also a sentence, and a disabled control also refuses the pointer.

## Typography

Two self-hosted latin subsets from `libs/theme/fonts/`, under the SIL Open Font License: Newsreader for the note and everything that reads like one, Instrument Sans for the chrome and the labels.

| Role    | Family          | Size   | Weight | Line    | Tracking | Used for                                                                                            |
| ------- | --------------- | ------ | ------ | ------- | -------- | --------------------------------------------------------------------------------------------------- |
| note    | Newsreader      | 19px   | 450    | 1.65    | —        | the note's text                                                                                     |
| reading | Newsreader      | 17px   | 400    | 1.6     | —        | the search field, a result's snippet, the settings rule, the empty state and the assistant's answer |
| chrome  | Instrument Sans | 14px   | 400    | 1.5     | —        | the bar, buttons and the page's body                                                                |
| status  | Instrument Sans | 12px   | 400    | 1.5     | —        | the status line and a result's secondary line                                                       |
| label   | Instrument Sans | 11px   | 500    | 1.4     | 0.1em    | dates and the settings nav, uppercase                                                               |
| mark    | Instrument Sans | 10px   | 600    | 1.4     | 0.1em    | the generated mark, uppercase                                                                       |
| code    | ui-monospace    | 0.85em | 400    | inherit | —        | inline code and a fenced block                                                                      |

## Spacing

The base unit is 4px. The scale lists only the steps the interface uses.

| Step | Used for                                                                    |
| ---- | --------------------------------------------------------------------------- |
| 2px  | the gap between the window dots and between an entry's action buttons       |
| 4px  | the gap where a narrow page stacks its date over its text                   |
| 5px  | the bar's right padding, the gap between bar controls, the field's rule     |
| 6px  | a result date's top offset                                                  |
| 7px  | an entry date's top offset and the status line's padding and radius         |
| 8px  | a button's padding and the assistant text's top margin                      |
| 10px | the status line's horizontal padding                                        |
| 12px | the assistant head's gap                                                    |
| 14px | the settings result's top margin and a settings button's horizontal padding |
| 16px | the assistant panel's horizontal padding                                    |
| 20px | the status line's bottom offset and the assistant's narrow-screen inset     |
| 22px | the results' top padding                                                    |
| 24px | the assistant's right offset and a settings button's top margin             |
| 26px | the window dot's hit area and a result's bottom padding                     |
| 30px | the log's and the settings page's top padding                               |
| 34px | a bar control's hit area and the settings result's width cap                |
| 40px | the narrow column's side inset and the fatal screen's padding               |
| 44px | the bar's height                                                            |
| 48px | an entry's bottom padding                                                   |
| 56px | the assistant's bottom offset                                               |
| 64px | the column's side inset                                                     |
| 45vh | the empty paper below every page                                            |
