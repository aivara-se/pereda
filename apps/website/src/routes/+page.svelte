<script>
  import { onMount, untrack } from "svelte";

  import { page } from "$app/state";

  import Entry from "#lib/Entry.svelte";
  import { call } from "#lib/client.js";
  import { formatDay } from "#lib/days.js";
  import { say } from "#lib/notice.svelte.js";
  import { openStore, session } from "#lib/session.svelte.js";

  let days = $state([]);
  let more = $state(false);
  let busy = $state(false);
  let loaded = $state(false);

  // A search result or a date jump opens the log at a day: the page is read
  // bounded by the day after it, so the first entry is the newest day at or
  // before the day that was asked for (docs/adrs/013).
  const from = $derived(page.url.searchParams.get("from") ?? undefined);

  $effect(() => {
    const target = from;
    if (session.status !== "ready") return;
    untrack(() => load(target));
  });

  async function load(target) {
    busy = true;
    try {
      const answer = await call(
        "openLog",
        target === undefined ? {} : { from: target },
      );
      days = answer.days;
      more = answer.more;
      loaded = true;
      if (target !== undefined && answer.days[0]?.day !== target) {
        say(`The newest day at or before ${formatDay(target)}.`);
      }
    } catch (error) {
      say(error.message, true);
    } finally {
      busy = false;
    }
  }

  async function older() {
    if (!more || busy || days.length === 0) return;
    busy = true;
    try {
      const answer = await call("openLog", { before: days[days.length - 1].day });
      const seen = new Set(days.map((entry) => entry.day));
      days = [...days, ...answer.days.filter((entry) => !seen.has(entry.day))];
      more = answer.more;
    } catch (error) {
      say(error.message, true);
    } finally {
      busy = false;
    }
  }

  // Scrolling past the last entry asks for the page before it.
  let edge;

  onMount(() => {
    openStore();
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) older();
    });
    seen.observe(edge);
    return () => seen.disconnect();
  });
</script>

<div class="page">
  {#if loaded}
    {#each days as entry (entry.day)}
      <Entry
        {entry}
        today={session.today}
        onremove={(gone) => (days = days.filter((day) => day !== gone))}
      />
    {/each}
  {/if}
  <div bind:this={edge}></div>
</div>
