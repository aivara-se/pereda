<script>
  import { onMount } from "svelte";

  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  import "../app.css";

  import { notice } from "#lib/notice.svelte.js";
  import { openStore, session } from "#lib/session.svelte.js";

  let { children } = $props();

  onMount(() => {
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

  // The bar names the page it is on: the route, not the path the host serves.
  const here = $derived((page.route.id ?? "/").replace(/\/$/, "") || "/");
</script>

<header class="bar">
  <a class="mark" href={resolve("/")} title="Today">Pereda</a>
  <nav class="tools" aria-label="Notes">
    <a
      class="icon"
      href={resolve("/search")}
      title="Search"
      aria-current={here === "/search" ? "page" : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <span class="visually-hidden">Search</span>
    </a>
  </nav>
</header>

{#if here === "/"}
  <a
    class="icon corner"
    href={resolve("/settings")}
    title="Settings"
    aria-label="Settings"
  >
    <svg class="gear" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1 1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </svg>
  </a>
{/if}

{#if session.status === "failed"}
  <main>
    <div class="fatal">
      <h1>Pereda cannot keep notes in this browser</h1>
      <p>{session.error}</p>
      <p>
        The web app keeps its notes in the browser's own storage, and this
        browser did not give it a place to write. Nothing was kept and nothing
        was lost: no note was written anywhere.
      </p>
    </div>
  </main>
{:else if session.status === "opening"}
  <main>
    <div class="page">
      <p class="empty">Opening the notes…</p>
    </div>
  </main>
{:else}
  <main>
    {@render children()}
  </main>
{/if}

<p class="status" class:failed={notice.failed} hidden={notice.text === ""}>
  {notice.text}
</p>