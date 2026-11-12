<script>
  import { call } from "#lib/client.js";
  import { formatShortDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";
  import { hide, show } from "#lib/surfaces.js";

  let { onopen, onjump, before, today } = $props();

  const SEARCH_DEBOUNCE = 200;

  let root;
  let field;
  let resultsEl;
  let query = $state("");
  let days = $state([]);
  let timer = 0;
  let token = 0; // the newest search, so a slow one cannot win
  let shown = false; // the mode is open, not fading in or out

  // The field takes the caret and an empty log of results; the mode is the
  // page's to open and close. ⌘F while the mode is open keeps the query and
  // brings the caret back, as the desktop's does.
  export function open() {
    if (!shown) {
      clearTimeout(timer);
      token += 1;
      query = "";
      days = [];
      hide(resultsEl);
      shown = true;
    }
    show(root);
    field.focus();
    field.select();
  }

  // Leaving empties the field and lets the results area go with its own fade.
  export function close() {
    clearTimeout(timer);
    token += 1;
    shown = false;
    hide(root, () => {
      query = "";
      days = [];
    });
    hide(resultsEl);
  }

  // Every word must be in a note, as a prefix, in any order, and a text search
  // never reaches today. An exact date opens its day before that rule. An empty
  // field stays open with nothing under it.
  async function look() {
    const mine = ++token;
    if (query.trim() === "") {
      hide(resultsEl, () => (days = []));
      return;
    }
    if (!(await before())) return;
    let answer;
    try {
      answer = await call("searchNotes", { query });
    } catch (error) {
      if (mine !== token) return;
      days = [];
      say(`Could not search — ${error.message}`, true);
      show(resultsEl);
      return;
    }
    if (mine !== token) return;
    if (answer.refused !== undefined) {
      // A date after today: say so and leave the list where it is.
      say(answer.refused, true);
      return;
    }
    if (answer.jump !== undefined) {
      onjump(answer.jump);
      return;
    }
    days = answer.days;
    show(resultsEl);
    resultsEl.scrollTop = 0;
  }

  function typed() {
    clearTimeout(timer);
    if (query.trim() === "") {
      token += 1;
      hide(resultsEl, () => (days = []));
      return;
    }
    timer = setTimeout(look, SEARCH_DEBOUNCE);
  }
</script>

<section class="search-page surface" bind:this={root} hidden>
  <div class="search">
    <label class="date" for="query">Search</label>
    <input
      id="query"
      class="field"
      type="search"
      placeholder="Any word in a note"
      autocomplete="off"
      spellcheck="false"
      bind:this={field}
      bind:value={query}
      oninput={typed}
    />
  </div>

  <div class="results surface" bind:this={resultsEl} hidden>
    {#if days.length === 0}
      <p class="empty">No note says that.</p>
    {:else}
      {#each days as result (result.day)}
        <button class="result" type="button" onclick={() => onopen(result.day)}>
          <span class="date"
            >{result.day === today ? "Today" : formatShortDay(result.day)}</span
          >
          <span class="snippet">{result.snippet}</span>
        </button>
      {/each}
    {/if}
  </div>
</section>
