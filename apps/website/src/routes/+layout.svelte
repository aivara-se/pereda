<script>
  import { onMount } from "svelte";

  import "../app.css";

  import { openStore, session } from "#lib/session.svelte.js";
  import { startPainting } from "#lib/surfaces.js";

  let { children } = $props();

  onMount(() => {
    startPainting();
    openStore();

    // A new worker deletes the cache of the build it replaces, so a page that
    // was already controlled reloads once when the new worker takes over, and
    // its files and its cache name the same build. The first install has no
    // controller to replace and does not reload.
    if (!navigator.serviceWorker?.controller) return;
    let reloading = false;
    const reload = () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", reload);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", reload);
  });
</script>

{#if session.status === "failed"}
  <main>
    <div class="fatal">
      <div class="fatal-body">
        <h1>Pereda cannot keep notes in this browser</h1>
        <p>{session.error}</p>
        <p class="hint">
          The web app keeps its notes in the browser's own storage, and this
          browser did not give it a place to write. Nothing was kept and nothing
          was lost: no note was written anywhere.
        </p>
      </div>
    </div>
  </main>
{:else if session.status === "opening"}
  <main>
    <div class="page">
      <p class="empty">Opening the notes…</p>
    </div>
  </main>
{:else}
  {@render children()}
{/if}
