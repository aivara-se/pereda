<script>
  import { onMount } from "svelte";

  import { writeExport } from "@pereda/notes/export.js";

  import { call } from "#lib/client.js";
  import { openStore, session } from "#lib/session.svelte.js";

  let exporting = $state(false);
  let report = $state({ text: "", failed: false });

  onMount(openStore);

  // The notes are one Markdown file per day, in a folder the person picks. A
  // browser that cannot write a folder says so; nothing is downloaded into a
  // directory nobody chose (docs/adrs/024).
  async function exportNotes() {
    if (exporting) return;
    if (typeof window.showDirectoryPicker !== "function") {
      report = {
        text: "This browser cannot write to a folder. Export needs a browser that offers the File System Access API.",
        failed: true,
      };
      return;
    }

    let folder;
    try {
      folder = await window.showDirectoryPicker({ mode: "readwrite" });
    } catch {
      // The picker was dismissed: nothing was written and nothing is said.
      return;
    }

    exporting = true;
    report = { text: "", failed: false };
    try {
      const rows = await call("all");
      const result = await writeExport(
        rows,
        (day) => `${day}.md`,
        // The page's writer is the folder it picked: the same-named file is
        // replaced because create is true, and the body is written as stored.
        async (name, body) => {
          const file = await folder.getFileHandle(name, { create: true });
          const stream = await file.createWritable();
          await stream.write(body);
          await stream.close();
        },
      );
      if (result.failed !== null) {
        const count = result.written === 1 ? "1 file was" : `${result.written} files were`;
        report = {
          text: `The export stopped at ${result.failed.day}: ${result.failed.reason}. ${count} written before it.`,
          failed: true,
        };
        return;
      }
      report = {
        text:
          result.written === 0
            ? "There are no notes to export."
            : `Wrote ${result.written} ${result.written === 1 ? "note" : "notes"} to ${folder.name}.`,
        failed: false,
      };
    } catch (error) {
      report = { text: error.message, failed: true };
    } finally {
      exporting = false;
    }
  }
</script>

<div class="settings">
  <p class="settings-nav">Settings</p>
  <div class="settings-panel">
    <p class="settings-rule">
      Export writes one Markdown file per day, named <code>YYYY-MM-DD.md</code>,
      into the folder you choose. The note is written exactly as it is stored; a
      file of the same name in that folder is replaced.
    </p>
    <button
      class="settings-button"
      type="button"
      onclick={exportNotes}
      disabled={exporting || session.status !== "ready"}
    >
      {exporting ? "Exporting…" : "Export Data"}
    </button>
    <p class="settings-result" class:error={report.failed} role="status">
      {report.text}
    </p>
  </div>
</div>
