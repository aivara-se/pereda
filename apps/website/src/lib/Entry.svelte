<script>
  import Note from "#lib/Note.svelte";
  import { onMount } from "svelte";

  import { call } from "#lib/client.js";
  import { formatDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";

  // One entry of the log. Today is always writable and carries no action row;
  // an older note is read-only until its edit button is pressed, and a press
  // anywhere on the entry selects it.
  let { entry, today, onremove } = $props();

  let root;
  let editor = null;
  let selected = $state(false);
  let editing = $state(entry.day === today);
  let counter = entry.seq;
  let timer = null;
  let saved = Promise.resolve(true); // every write this entry asked for, in order

  const open = $derived(entry.day === today || editing);

  // One entry is selected at a time: a press anywhere else ends this one's
  // selection, and its row leaves on its own fade.
  onMount(() => {
    const outside = (event) => {
      if (!root.contains(event.target)) selected = false;
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  });

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
    counter += 1;
    const seq = counter;
    try {
      const answer = await call("saveDay", { day: entry.day, body, seq });
      counter = answer.seq;
      entry.body = body;
      return true;
    } catch (error) {
      counter = seq - 1;
      say(`The note was not saved: ${error.message}`, true);
      return false;
    }
  }

  function changed() {
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  }

  // Edit puts the caret at the end of the note and makes it writable, which is
  // what selection does on the desktop.
  function edit() {
    editing = true;
    selected = true;
    editor.setEditable(true);
    editor.focusEnd();
  }

  // Leaving a note ends an older one's edit: the text is saved first, then the
  // note takes no keystroke again and its actions come back. A note cleared to
  // nothing leaves the log, as it does on the desktop.
  async function left() {
    if (entry.day === today || !editing) {
      selected = false;
      flush();
      return;
    }
    const empty = editor.body() === "";
    const ok = await flush();
    editing = false;
    editor.setEditable(false);
    selected = false;
    if (ok && empty) onremove(entry);
  }

  // Delete is the note cleared: the store keeps the tombstone, and the log
  // stops showing the day. It asks once before the write, as the desktop does,
  // with the browser's own question.
  async function remove() {
    const sure = window.confirm(
      `Delete the note for ${formatDay(entry.day)}? The text is gone for good. There is no undo.`,
    );
    if (!sure) return;
    if (!(await flush())) return;
    const was = editor.body();
    editor.setBody("");
    counter += 1;
    try {
      await call("saveDay", { day: entry.day, body: "", seq: counter });
      onremove(entry);
    } catch (error) {
      editor.setBody(was);
      say(`The note was not deleted: ${error.message}`, true);
    }
  }
</script>

<article
  bind:this={root}
  class="entry"
  class:today={entry.day === today}
  class:open
  class:selected
  onpointerdown={() => (selected = true)}
>
  <div class="date">
    <time datetime={entry.day}
      >{entry.day === today ? "Today" : formatDay(entry.day)}</time
    >
    {#if !open}
      <div class="actions">
        <button type="button" title="Edit" onclick={edit}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
          </svg>
          <span class="visually-hidden">Edit</span>
        </button>
        <button type="button" title="Delete" onclick={remove}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
          </svg>
          <span class="visually-hidden">Delete</span>
        </button>
      </div>
    {/if}
  </div>
  <Note
    body={entry.body}
    readOnly={!open}
    label={`Note of ${entry.day}`}
    onEdit={changed}
    onFocus={() => (selected = true)}
    onBlur={left}
    onready={(made) => (editor = made)}
  />
</article>
