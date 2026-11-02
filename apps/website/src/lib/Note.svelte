<script>
  import { onMount } from "svelte";

  import { noteEditor } from "@pereda/note-editor";

  // One note on screen: the shared editor, mounted into this page's own column.
  // The library owns the text and the marks; the page owns the debounce and the
  // save, which is the desktop's split too.
  let { body = "", readOnly = true, label, onEdit, onFocus, onBlur, onready } =
    $props();

  let host;

  onMount(() => {
    const editor = noteEditor(host, {
      body,
      readOnly,
      label,
      onEdit,
      onFocus,
      onBlur,
    });
    onready(editor);
    return () => editor.destroy();
  });
</script>

<div class="note" bind:this={host}></div>
