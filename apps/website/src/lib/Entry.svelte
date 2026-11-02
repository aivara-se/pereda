<script>
  import Note from "#lib/Note.svelte";
  import { call } from "#lib/client.js";
  import { formatDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";

  // One entry of the log. Today is always writable and carries no action row;
  // an older note is read-only until its edit button is pressed, and a press
  // anywhere on the entry selects it.
  let { entry, today, onremove } = $props();

  let editor = null;
  let selected = $state(false);
  let editing = $state(entry.day === today);
  let counter = entry.seq;
  let timer = null;
  let saving = false;
  let waiting = false;

  const open = $derived(entry.day === today || editing);

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (editor === null) return;
    if (saving) {
      waiting = true;
      return;
    }
    const body = editor.body();
    if (body === entry.body) return;
    writing(body);
  }

  async function writing(body) {
    saving = true;
    counter += 1;
    const seq = counter;
    try {
      const answer = await call("saveDay", { day: entry.day, body, seq });
      counter = answer.seq;
      entry.body = body;
    } catch (error) {
      counter = seq - 1;
      say(`The note was not saved: ${error.message}`, true);
    } finally {
      saving = false;
      if (waiting) {
        waiting = false;
        flush();
      }
    }
  }

  function changed() {
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  }

  // Edit puts the caret at the end of the note and fades the rest of the page,
  // which is what selection does on the desktop.
  function edit() {
    editing = true;
    selected = true;
    editor.setEditable(true);
    editor.focusEnd();
  }

  // Delete is the note cleared: the store keeps the tombstone, and the log
  // stops showing the day.
  async function remove() {
    clearTimeout(timer);
    timer = null;
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
  class="entry"
  class:today={entry.day === today}
  class:open
  class:selected
  onpointerdown={() => (selected = true)}
>
  <div class="date">
    <time datetime={entry.day}>{formatDay(entry.day)}</time>
    {#if selected && !open}
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
    onBlur={() => {
      if (!open) selected = false;
    }}
    onready={(made) => (editor = made)}
  />
</article>
