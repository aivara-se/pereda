<script>
  import { onMount } from "svelte";

  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  import { call } from "#lib/client.js";
  import { formatDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";
  import { openStore, session } from "#lib/session.svelte.js";

  let field;
  let query = $state("");
  let results = $state([]);
  let asked = $state(false);

  onMount(openStore);

  // Every word must be in the note, in any order, and a word may be only its
  // beginning. A date is answered before that rule, by the same backend call.
  async function look(event) {
    event.preventDefault();
    if (session.status !== "ready") return;
    const words = query;
    try {
      const answer = await call("searchNotes", { query: words });
      if (answer.refused !== undefined) {
        say(answer.refused, true);
        return;
      }
      if (answer.jump !== undefined) {
        goto(`${resolve("/")}?from=${answer.jump.day}`);
        return;
      }
      results = answer.days;
      asked = true;
    } catch (error) {
      say(error.message, true);
    }
  }

  function open(day) {
    goto(`${resolve("/")}?from=${day}`);
  }
</script>

<div class="page">
  <form class="search" onsubmit={look}>
    <label class="date" for="query">Search</label>
    <input
      id="query"
      class="field"
      type="text"
      bind:this={field}
      bind:value={query}
      placeholder="A word, or a date"
      autocomplete="off"
      spellcheck="false"
      aria-label="Search the notes"
    />
  </form>

  <div class="results">
    {#if asked}
      {#if results.length === 0}
        <p class="empty">No day holds every one of those words.</p>
      {:else}
        {#each results as result (result.day)}
          <button class="result" type="button" onclick={() => open(result.day)}>
            <span class="date">{formatDay(result.day)}</span>
            <span class="snippet">{result.snippet}</span>
          </button>
        {/each}
      {/if}
    {/if}
  </div>
</div>