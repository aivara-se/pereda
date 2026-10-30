# 011 - One Shortcut Summons the Window

## Context

The app opens on today, but only when the person starts it: from another app, reaching today's note means finding Pereda first. The product decides a shortcut.

The runtime registers system-wide hotkeys on all three platforms, for the life of the process. On Linux Wayland the request goes through the desktop's GlobalShortcuts portal, which may refuse it or let the person pick another combination. A press reaches the backend and every open window.

A shortcut could bring a second capture window, a menu-bar or tray presence, or a rebindable list of combinations. Each is a second surface — a window to close, an icon to explain, a settings screen to store and validate — and the app has one window and no preferences.

## Decision

- One hotkey, id `today`, combo `cmd+shift+d` — ⌘⇧D on macOS, Ctrl+Shift+D on Windows and Linux — registered by the backend at launch.
- A press shows and focuses the window and takes the Today path: flush the open entry, ask the backend for today, load it. One behaviour, not a second one.
- The result of registering is checked: `false`, or a system without global hotkeys, is said once in the status line, and the app works without the shortcut.
- The combo is fixed in this version. No rebinding, no settings surface, no tray.
- The hotkey lives only while the app runs.

## Consequences

- While Pereda runs it holds that combination system-wide, so another app that used it loses it; a fixed combination will collide for someone.
- On a Wayland desktop without the portal, or where the person declines the desktop's prompt, the shortcut never fires, and the status line is the only signal.
- On Windows and Linux closing the window ends the process, so the shortcut is gone until the app is started again; macOS keeps the app running without a window. The promise is "while Pereda runs", never "from cold".
- A press while the window is in front is not a toggle: it goes to today, like the Today button.
- No state is added and nothing is stored; a collision is discovered only by the status line.
