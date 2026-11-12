<script>
  import { onMount } from "svelte";

  import { keyAction } from "@pereda/keys/keys.js";
  import { resolve } from "$app/paths";

  import Entry from "#lib/Entry.svelte";
  import Search from "#lib/Search.svelte";
  import Settings from "#lib/Settings.svelte";
  import { writingNotice } from "@pereda/notes/midnight.js";

  import { call } from "#lib/client.js";
  import { formatNoticeDay, formatShortDay } from "#lib/days.js";
  import { notice, say } from "#lib/notice.svelte.js";
  import { session } from "#lib/session.svelte.js";
  import { hide, show, startPainting } from "#lib/surfaces.js";

  // The same five keys the desktop reads. ⌘T never arrives: the browser takes it
  // for a new tab before the page sees it (docs/adrs/043-the-web-is-the-desktops-page.md).
  const PLATFORM = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  const OS = /mac/i.test(PLATFORM) ? "macos" : "other";
  const SEARCH_DEBOUNCE = 200;

  let mode = $state("log"); // log | search | settings
  let days = $state([]);
  let more = $state(false);
  let loaded = $state(false);
  let focusedDay = $state(null);
  let logScroll = 0;
  let settingsEditing = false;
  let busy = false;
  let loadToken = 0;

  const handles = new Map(); // day -> the entry's flush and its way into the caret

  let midnight = $state(null); // the loaded day is behind the store's today

  let logEl;
  let edge;
  let search;
  let settings;
  let statusEl;

  // The status line is the problem the page has, or the day the text is going
  // to when the log is behind midnight. A real problem outranks it, and a
  // reload clears the midnight line.
  const line = $derived(
    notice.text !== ""
      ? notice.text
      : midnight === null
        ? ""
        : writingNotice(midnight.day, midnight.today, (day) =>
            formatNoticeDay(day, midnight.today),
          ),
  );
  const isError = $derived(notice.text !== "" && notice.failed);

  // One entry at a time: the log asks each for its write, and a mode opens only
  // when every write that was asked for has landed.
  function register(day, handle) {
    handles.set(day, handle);
  }

  function forget(day) {
    handles.delete(day);
  }

  function flushAll() {
    return Promise.all([...handles.values()].map((handle) => handle.flush())).then(
      (results) => results.every(Boolean),
    );
  }

  // The log opens on today at the top, or at the page that holds a day a search
  // asked for.
  async function loadLog(from) {
    const token = ++loadToken;
    let answer;
    try {
      answer = await call(
        "openLog",
        from === undefined ? {} : { from },
      );
    } catch (error) {
      say(`Could not load the notes — ${error.message}`, true);
      return;
    }
    if (token !== loadToken) return;
    days = answer.days;
    more = answer.more;
    loaded = true;
    midnight = null;
    logEl.scrollTop = 0;
    if (from !== undefined) {
      if (days.length === 0) {
        say(`No note on or before ${formatShortDay(from)}.`);
      } else if (days[0].day !== from) {
        say(
          `No note on ${formatShortDay(from)} — showing ${formatShortDay(days[0].day)}.`,
        );
      }
    }
  }

  async function older() {
    if (!more || busy || days.length === 0) return;
    busy = true;
    try {
      const answer = await call("openLog", {
        before: days[days.length - 1].day,
      });
      const seen = new Set(days.map((day) => day.day));
      days = [...days, ...answer.days.filter((day) => !seen.has(day.day))];
      more = answer.more;
    } catch (error) {
      say(error.message, true);
    } finally {
      busy = false;
    }
  }

  // Today is the page's own address: the mark and ⌘T take it, and either mode
  // leaves for it.
  async function goToday() {
    if (!(await flushAll())) return;
    if (mode === "search") {
      search.close();
      show(logEl);
      mode = "log";
    } else if (mode === "settings") {
      settings.close();
      show(logEl);
      mode = "log";
    }
    await loadLog();
  }

  // The search is a mode over the log, opened by ⌘F or the bar's one control:
  // the field takes the caret, and the log leaves the screen until Esc closes it.
  async function openSearch() {
    if (mode === "search") {
      search.open();
      return;
    }
    if (!(await flushAll())) return;
    if (mode === "settings") settings.close();
    mode = "search";
    hide(logEl);
    search.open();
  }

  async function closeSearch() {
    if (mode !== "search") return;
    if (!(await flushAll())) return;
    mode = "log";
    search.close();
    show(logEl);
    await loadLog();
  }

  // Settings opens over the log it leaves and returns to the same day, scroll
  // and caret.
  async function openSettings() {
    if (mode === "settings") return;
    if (!(await flushAll())) return;
    if (mode === "search") search.close();
    logScroll = logEl.scrollTop;
    settingsEditing =
      focusedDay !== null && (handles.get(focusedDay)?.editing() ?? false);
    mode = "settings";
    hide(logEl);
    settings.open();
  }

  function closeSettings() {
    if (mode !== "settings") return;
    mode = "log";
    settings.close();
    show(logEl);
    logEl.scrollTop = logScroll;
    const open = focusedDay === null ? undefined : handles.get(focusedDay);
    if (open !== undefined) {
      if (settingsEditing) open.edit();
      else open.focus();
    }
    settingsEditing = false;
  }

  // A result or a date opens the log at its day; the mode is done then.
  async function openDay(day) {
    if (!(await flushAll())) return;
    mode = "log";
    search.close();
    show(logEl);
    await loadLog(day);
  }

  // ⌘↑ and ⌘↓ make the day the unit: the day above is newer, the day below is
  // older, and the caret lands at the end of the note reached.
  function moveDay(delta) {
    if (mode !== "log" || days.length === 0) return;
    const index = focusedDay === null ? 0 : days.findIndex((day) => day.day === focusedDay);
    const from = index === -1 ? 0 : index;
    const target = days[Math.min(days.length - 1, Math.max(0, from + delta))];
    handles.get(target.day)?.edit();
  }

  // The mark is the page's name and the way home: the log at today, from any
  // mode. It is a link so a reader can see where it goes; the page decides.
  function onHome(event) {
    event.preventDefault();
    goToday();
  }

  function onKeydown(event) {
    const action = keyAction(event, OS);
    if (action === null) return;

    if (action === "escape") {
      if (mode === "settings") {
        event.preventDefault();
        closeSettings();
        return;
      }
      // Search is a mode with one way out: the field has the caret, but a result
      // can take the focus, and the key leaves from wherever it is in the mode.
      if (mode === "search") {
        event.preventDefault();
        closeSearch();
        return;
      }
      return;
    }

    // Every other key belongs to the page, not to the browser's own reading of
    // it: ⌘F would open its find bar and ⌘, its settings.
    event.preventDefault();
    if (action === "search") {
      openSearch();
      return;
    }
    if (action === "settings") {
      openSettings();
      return;
    }
    if (action === "today") {
      goToday();
      return;
    }
    moveDay(action === "previous" ? -1 : 1);
  }

  $effect(() => {
    if (line === "") hide(statusEl);
    else show(statusEl);
  });

  onMount(() => {
    startPainting();
    loadLog();
    document.addEventListener("keydown", onKeydown, true);

    // Scrolling past the last entry asks for the page before it.
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) older();
    });
    seen.observe(edge);

    return () => {
      document.removeEventListener("keydown", onKeydown, true);
      seen.disconnect();
    };
  });
</script>

<header class="bar">
  <a class="mark" href={resolve("/")} title="Today" onclick={onHome}>Pereda</a>
  <nav class="tools" aria-label="Notes">
    <button
      class="icon"
      type="button"
      title="Search"
      aria-label="Search"
      aria-current={mode === "search" ? "page" : undefined}
      onclick={openSearch}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    </button>
  </nav>
</header>

<button
  class="icon corner"
  type="button"
  title="Settings"
  aria-label="Settings"
  hidden={mode !== "log"}
  onclick={openSettings}
>
  <svg class="gear" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
    />
  </svg>
</button>

<div class="app">
  <div class="pages">
    <main class="page surface" bind:this={logEl}>
      <div class="log">
        {#if loaded}
          {#each days as entry (entry.day)}
            <Entry
              {entry}
              today={session.today}
              onready={(handle) => register(entry.day, handle)}
              onforget={() => forget(entry.day)}
              onfocus={() => (focusedDay = entry.day)}
              onmidnight={(next) => (midnight = next)}
              onremove={(gone) => (days = days.filter((day) => day !== gone))}
            />
          {/each}
        {/if}
        <div bind:this={edge}></div>
      </div>
    </main>

    <Search bind:this={search} onjump={openDay} before={flushAll} today={session.today} />
    <Settings bind:this={settings} />
  </div>
</div>

<p
  class="status surface"
  bind:this={statusEl}
  class:info={!isError}
  hidden
>
  {line}
</p>
