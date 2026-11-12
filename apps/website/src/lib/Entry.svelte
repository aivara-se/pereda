<script>
  import { onMount, onDestroy } from "svelte";

  import Note from "#lib/Note.svelte";
  import { call } from "#lib/client.js";
  import { formatShortDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";

  // One entry of the log. Today is always writable and carries no action row;
  // an older note is read-only until its edit button is pressed, and a press
  // anywhere on the entry selects it.
  let { entry, today, onready, onforget, onfocus, onremove, onmidnight } = $props();

  const DEBOUNCE = 300;

  let root;
  let editor = null;
  let editing = $state(entry.day === today);
  let counter = entry.seq;
  let timer = null;
  let saved = Promise.resolve(true); // every write this entry asked for, in order

  const open = $derived(entry.day === today || editing);

  // One write at a time, in order. A flush answers with the promise of every
  // write it has queued, so a blur can wait for the text it is about to close.
  function flush() {
    clearTimeout(timer);
    timer = null;
    if (editor === null) return saved;
    const body = editor.body();
    if (body === entry.body) return saved;
    saved = saved.then(() => writing(body));
    return saved;
  }

  async function writing(body) {
    const seq = counter + 1;
    try {
      const answer = await call("saveDay", { day: entry.day, body, seq });
      counter = answer.seq;
      entry.body = body;
      // The reply says which day the store is on: only a save can say the log
      // is behind midnight.
      if (answer.today > entry.day) onmidnight({ day: entry.day, today: answer.today });
      return true;
    } catch (error) {
      say(`Not saved — ${error.message}`, true);
      return false;
    }
  }

  function changed() {
    clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE);
  }

  // Edit puts the caret at the end of the note and makes it writable.
  function edit() {
    editing = true;
    editor.setEditable(true);
    editor.focusEnd();
  }

  // Leaving a note ends an older one's edit: the text is saved first, then the
  // note takes no keystroke again. A note cleared to nothing leaves the log, as
  // it does on the desktop.
  function left() {
    if (entry.day === today) {
      flush();
      return;
    }
    if (!editing) return;
    const empty = editor.body() === "";
    editing = false;
    editor.setEditable(false);
    flush().then((ok) => {
      if (ok && empty) onremove(entry);
    });
  }

  // Delete asks once on an older day and cannot be undone. Today has no delete:
  // clearing its last character is how the text goes.
  async function remove() {
    const sure = window.confirm(
      `Delete the note for ${formatShortDay(entry.day)}?\n\nThe text is gone for good. There is no undo.`,
    );
    if (!sure) return;
    if (!(await flush())) return;
    const was = editor.body();
    editor.setBody("");
    const seq = counter + 1;
    try {
      const answer = await call("saveDay", { day: entry.day, body: "", seq });
      counter = answer.seq;
      onremove(entry);
    } catch (error) {
      editor.setBody(was);
      say(`The note was not deleted: ${error.message}`, true);
    }
  }

  onMount(() => {
    onready({ flush, edit, focus: () => editor.focus(), editing: () => editing });
  });

  onDestroy(() => onforget());
</script>

<article
  bind:this={root}
  class="entry"
  class:today={entry.day === today}
  class:editing={open}
  onmousedown={(event) => {
    if (event.target.closest(".note, .action") !== null) return;
    event.preventDefault();
    editor.focus();
  }}
>
  <div class="meta">
    <p class="date">{entry.day === today ? "Today" : formatShortDay(entry.day)}</p>
    {#if entry.day !== today}
      <div class="actions">
        <button
          class="action"
          type="button"
          title="Edit this note"
          aria-label={`Edit the note for ${formatShortDay(entry.day)}`}
          onclick={edit}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
        </button>
        <button
          class="action remove"
          type="button"
          title="Delete this note"
          aria-label={`Delete the note for ${formatShortDay(entry.day)}`}
          onclick={remove}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14" />
            <path d="M10 7V5h4v2" />
            <path d="M7 7l1 12h8l1-12" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
  <Note
    body={entry.body}
    readOnly={!open}
    label={`Note for ${formatShortDay(entry.day)}`}
    onEdit={changed}
    onFocus={() => onfocus()}
    onBlur={left}
    onready={(made) => (editor = made)}
  />
</article>
