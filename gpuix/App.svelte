<script lang="ts">
	// The page: one log of days, newest first, every entry saved as it is typed.
	import {
		focus_element,
		get_native,
		on_window_key,
		set_css_vars,
		window_size,
		type GpuixEvent,
		type ShadowNode
	} from 'gpuix-svelte';
	import Portal from 'gpuix-svelte/components/Portal.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { api, saveNow, type OpenedDay } from './src/api.ts';
	import { register_app_fonts } from './src/fonts.ts';
	import { noteRows } from './src/measure.ts';

	const DEBOUNCE = 300;
	const LOAD_AT = 700; // pixels from the bottom that ask for the next page
	const DATE_COLUMN = 120;
	const GUTTER = 24;

	const LIGHT = {
		bg: '#faf9f6',
		ink: '#26231f',
		muted: '#7d756a',
		icon: '#6a6155',
		hover: 'rgba(38, 35, 31, 0.06)',
		accent: '#a9541c',
		'accent-soft': '#f0e0cf',
		error: '#a5342c'
	};
	const DARK = {
		bg: '#121110',
		ink: '#ece7dd',
		muted: '#958d80',
		icon: '#a79e90',
		hover: 'rgba(236, 231, 221, 0.07)',
		accent: '#dda36c',
		'accent-soft': '#2a231b',
		error: '#e59a92'
	};

	type Entry = {
		day: string;
		body: string;
		seq: number;
		savedBody: string;
		pending: string | null;
		runner: Promise<boolean> | null;
		timer: ReturnType<typeof setTimeout> | null;
	};

	let entries = $state<Entry[]>([]);
	let todayKey = $state<string | null>(null);
	let more = $state(false);
	let loading = false;
	let loadToken = 0;
	let focusedDay = $state<string | null>(null);
	let logError = $state('');
	// `$state` holds a plain `Map` without proxying it, so `.set()` would change
	// nothing the template can see; `SvelteMap` is the reactive one.
	const saveFailures = new SvelteMap<string, string>();
	let fatal = $state('');
	let confirmDay = $state<string | null>(null);
	let fontsReady = $state(false);

	let pageHeight = $state(600);
	let logHeight = $state(0);
	const nodes = new Map<string, ShadowNode>();

	// The window width fixes the column; the media query the web app used is a
	// value here, because there is no CSS media query in GPUI.
	const stacked = $derived(window_size.width < 620);
	const logWidth = $derived(Math.min(Math.max(window_size.width - 64, 240), 688));
	const textWidth = $derived(stacked ? logWidth : logWidth - DATE_COLUMN - GUTTER);

	// macOS keeps the appearance in the global domain; no other platform has an
	// equivalent that is worth a process, so they start light.
	const dark = is_dark();
	const palette = $derived(dark ? DARK : LIGHT);

	function is_dark(): boolean {
		if (process.platform !== 'darwin') return false;
		try {
			const result = Bun.spawnSync(['defaults', 'read', '-g', 'AppleInterfaceStyle']);
			return result.success && result.stdout.toString().trim() === 'Dark';
		} catch {
			return false;
		}
	}

	function line(day: string): string {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(year, month - 1, date).toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function longDate(day: string): string {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(year, month - 1, date).toLocaleDateString(undefined, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function label(day: string): string {
		return day === todayKey ? 'TODAY' : line(day).toUpperCase();
	}

	function status(): string {
		const failure = saveFailures.values().next().value;
		return failure === undefined ? logError : `Not saved — ${failure}`;
	}

	function showDelete(): boolean {
		if (focusedDay === null) return false;
		const entry = entries.find((candidate) => candidate.day === focusedDay);
		return entry !== undefined && entry.body !== '';
	}

	async function run(entry: Entry): Promise<boolean> {
		while (entry.pending !== null && entry.pending !== entry.savedBody) {
			const body = entry.pending;
			const stamp = entry.seq + 1;
			entry.pending = null;
			try {
				await api.saveDay({ day: entry.day, body, seq: stamp });
			} catch (message) {
				saveFailures.set(entry.day, (message as Error).message ?? String(message));
				return false;
			}
			entry.seq = stamp;
			entry.savedBody = body;
			saveFailures.delete(entry.day);
		}
		return true;
	}

	// One save in flight per entry; a newer body replaces the one waiting.
	function flushEntry(entry: Entry): Promise<boolean> {
		if (entry.timer !== null) {
			clearTimeout(entry.timer);
			entry.timer = null;
		}
		entry.pending = entry.body;
		if (entry.runner === null) {
			entry.runner = run(entry).then(
				(ok) => {
					entry.runner = null;
					return ok;
				},
				(error) => {
					entry.runner = null;
					throw error;
				}
			);
		}
		return entry.runner;
	}

	function flushAll(): Promise<boolean> {
		return Promise.all(entries.map(flushEntry)).then((results) => results.every(Boolean));
	}

	// A GPUI window has no blur or visibilitychange to flush on, and a quit ends the
	// process under the debounce's timer and any save in flight, so what is typed is
	// written here, synchronously, as the process goes.
	process.on('exit', () => {
		for (const entry of entries) {
			if (entry.body === entry.savedBody) continue;
			if (entry.timer !== null) clearTimeout(entry.timer);
			try {
				saveNow({ day: entry.day, body: entry.body, seq: entry.seq + 1 });
			} catch (error) {
				// No window is left to say it in; the row keeps what it had, and the next
				// launch shows it.
				console.error(`[pereda] ${entry.day} did not save on quit: ${(error as Error).message}`);
			}
		}
	});

	function maybeDrop(entry: Entry): void {
		if (entry.day === todayKey) return;
		if (entry.body !== '') return;
		dropEntry(entry);
	}

	function dropEntry(entry: Entry): void {
		const index = entries.indexOf(entry);
		if (index === -1) return;
		entries.splice(index, 1);
		nodes.delete(entry.day);
		if (focusedDay === entry.day) {
			const next = entries[index] ?? entries[index - 1] ?? null;
			focusedDay = next?.day ?? null;
			if (next !== undefined) void focusEntry(next);
		}
	}

	async function focusEntry(entry: Entry): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 0));
		const node = nodes.get(entry.day);
		if (node !== undefined) focus_element(node);
	}

	function makeEntry(day: OpenedDay): Entry {
		return {
			day: day.day,
			body: day.body,
			seq: day.seq,
			savedBody: day.body,
			pending: null,
			runner: null,
			timer: null
		};
	}

	async function loadLog(): Promise<void> {
		const token = ++loadToken;
		let result;
		try {
			result = await api.openLog();
		} catch (message) {
			fatal = (message as Error).message ?? String(message);
			return;
		}
		if (token !== loadToken) return;
		todayKey = result.today;
		entries = result.days.map(makeEntry);
		more = result.more;
		focusedDay = entries[0]?.day ?? null;
		logError = '';
		saveFailures.clear();
		if (entries[0] !== undefined) void focusEntry(entries[0]);
		void new Promise((resolve) => setTimeout(resolve, 0)).then(scrollTop);
	}

	// Ask for the days before the oldest one on screen.
	async function loadOlder(): Promise<void> {
		if (!more || loading || entries.length === 0) return;
		loading = true;
		const token = loadToken;
		try {
			const result = await api.openLog({ before: entries[entries.length - 1].day });
			if (token !== loadToken) return;
			for (const day of result.days) entries.push(makeEntry(day));
			more = result.more;
			logError = '';
		} catch (message) {
			logError = `Could not load older days — ${(message as Error).message ?? String(message)}`;
		} finally {
			loading = false;
		}
	}

	function scrollTop(): void {
		// The page node is the scroll container; its id is all scrollTo needs.
		const page = pageNode;
		if (page?.nativeId != null) {
			(get_native() as { scrollTo?: (id: number, x: number, y: number) => void } | null)?.scrollTo?.(
				page.nativeId,
				0,
				0
			);
		}
	}

	let pageNode: ShadowNode | null = null;

	async function goToday(): Promise<void> {
		if (!(await flushAll())) return;
		await loadLog();
	}

	function askDelete(): void {
		if (focusedDay === null) return;
		confirmDay = focusedDay;
	}

	async function removeDay(day: string): Promise<void> {
		const target = entries.find((entry) => entry.day === day);
		confirmDay = null;
		if (target === undefined) return;

		// The dialog's blur can start a save; let it settle, or the delete and
		// that save would carry one counter and one of them would lose.
		if (!(await flushEntry(target))) return;

		if (target.timer !== null) {
			clearTimeout(target.timer);
			target.timer = null;
		}
		target.pending = null;
		const stamp = target.seq + 1;
		try {
			await api.saveDay({ day: target.day, body: '', seq: stamp });
		} catch (message) {
			saveFailures.set(target.day, (message as Error).message ?? String(message));
			return;
		}
		target.seq = stamp;
		target.savedBody = '';
		target.body = '';
		saveFailures.delete(target.day);

		if (target.day === todayKey) {
			void focusEntry(target);
		} else {
			dropEntry(target);
		}
	}

	function onInput(entry: Entry, e: GpuixEvent & { value: string }): void {
		entry.body = e.value;
		entry.pending = e.value;
		if (entry.timer !== null) clearTimeout(entry.timer);
		entry.timer = setTimeout(() => {
			entry.timer = null;
			void flushEntry(entry);
		}, DEBOUNCE);
	}

	function onBlur(entry: Entry): void {
		void flushEntry(entry).then((ok) => {
			if (ok) maybeDrop(entry);
		});
	}

	function onScroll(e: GpuixEvent): void {
		const offset = (e as GpuixEvent & { scrollY?: number }).scrollY ?? 0;
		const fromBottom = logHeight + offset - pageHeight;
		if (fromBottom <= LOAD_AT) void loadOlder();
	}

	function keyActivate(event: GpuixEvent, action: () => void): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	$effect(() => {
		// The renderer only exists once the window is created, and a face that
		// arrives after an element has painted cannot restyle it: register, then
		// mount the tree on the frame after.
		if (!fontsReady) {
			register_app_fonts();
			fontsReady = true;
		}
	});

	$effect(() => {
		set_css_vars(palette);
	});

	$effect(() =>
		on_window_key('keydown', (event) => {
			if (event.key === 'escape' && confirmDay !== null) {
				event.preventDefault();
				confirmDay = null;
			}
		})
	);

	void loadLog();
</script>

{#if fontsReady}
<div class="app">
	<div
		class="page"
		style="padding-bottom: {Math.round(window_size.height * 0.45)}px"
		onscrollchange={onScroll}
		onlayout={(e) => (pageHeight = e.height ?? pageHeight)}
		{@attach (node) => (pageNode = node)}
	>
		<div
			class="log"
			style="width: {logWidth}px; padding-top: {stacked ? 78 : 92}px"
			onlayout={(e) => (logHeight = e.height ?? logHeight)}
		>
			{#each entries as entry (entry.day)}
				<div class="entry" class:stacked style="padding-bottom: {stacked ? 40 : 48}px">
					<text class="date" class:stacked>{label(entry.day)}</text>
					<textarea
						class="note"
						style="font-family: Newsreader"
						value={entry.body}
						minRows={noteRows(entry.body, textWidth)}
						placeholder="What happened?"
						aria-label={`Note for ${longDate(entry.day)}`}
						onchange={(e) => onInput(entry, e)}
						onfocus={() => (focusedDay = entry.day)}
						onblur={() => onBlur(entry)}
						{@attach (node) => nodes.set(entry.day, node)}
					></textarea>
				</div>
			{/each}
		</div>
	</div>

	<div class="fade"></div>

	<div class="tools">
		<div
			class="icon"
			hitbox="self"
			role="button"
			tabindex="0"
			aria-label="Today"
			onclick={goToday}
			onkeydown={(e) => keyActivate(e, goToday)}
		>
			<svg source={TODAY_ICON} style="width: 19px; height: 19px"></svg>
		</div>
		{#if showDelete()}
			<div
				class="icon danger"
				hitbox="self"
				role="button"
				tabindex="0"
				aria-label="Delete this note"
				onclick={askDelete}
				onkeydown={(e) => keyActivate(e, askDelete)}
			>
				<svg source={TRASH_ICON} style="width: 19px; height: 19px"></svg>
			</div>
		{/if}
	</div>

	{#if status() !== ''}
		<div class="status-wrap"><text class="status">{status()}</text></div>
	{/if}

	{#if confirmDay !== null}
		<Portal>
			<div class="scrim">
				<div class="dialog">
					<text class="dialog-title">
						{confirmDay === todayKey ? "Delete today's note?" : `Delete the note for ${line(confirmDay)}?`}
					</text>
					<text class="dialog-detail">The text is gone for good. There is no undo.</text>
					<div class="dialog-actions">
						<div class="dialog-button" hitbox="self" role="button" tabindex="0" onclick={() => (confirmDay = null)}>Keep</div>
						<div
							class="dialog-button danger"
							hitbox="self"
							role="button"
							tabindex="0"
							onclick={() => void removeDay(confirmDay as string)}
						>Delete</div>
					</div>
				</div>
			</div>
		</Portal>
	{/if}

	{#if fatal !== ''}
		<div class="fatal">
			<div class="fatal-body">
				<text class="fatal-title">Pereda cannot open its notes</text>
				<text class="fatal-message">{fatal}</text>
				<text class="fatal-hint">The file was not changed. Move it aside or restore a backup, then open Pereda again.</text>
			</div>
		</div>
	{/if}
</div>
{/if}

<script lang="ts" module>
	export const TODAY_ICON =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>';
	export const TRASH_ICON =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M10 7V5h4v2"/><path d="M7 7l1 12h8l1-12"/></svg>';
</script>

<style>
	.app {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background-color: var(--bg);
		color: var(--ink);
		font-size: 14px;
		line-height: 21px;
	}

	.page {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-grow: 1;
		min-height: 0;
		width: 100%;
		overflow-y: auto;
	}

	.log {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	.entry {
		position: relative;
		display: flex;
		flex-direction: row;
		gap: 24px;
		width: 100%;
	}

	.entry.stacked {
		flex-direction: column;
		gap: 4px;
	}

	.date {
		width: 120px;
		flex-shrink: 0;
		padding-top: 7px;
		color: var(--muted);
		font-size: 11px;
		line-height: 16.5px;
		text-align: right;
		white-space: nowrap;
	}

	.date.stacked {
		width: 100%;
		padding-top: 0;
		text-align: left;
	}

	.note {
		flex-grow: 1;
		width: 100%;
		padding: 0;
		border-width: 0;
		background-color: transparent;
		color: var(--ink);
		font-size: 19px;
		line-height: 31.35px;
		white-space: normal;
		user-select: text;
		selection-color: var(--accent-soft);
	}

	.tools {
		position: absolute;
		top: 18px;
		right: 20px;
		display: flex;
		flex-direction: row;
		gap: 2px;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		color: var(--icon);
		cursor: pointer;
	}

	.icon:hover {
		background-color: var(--hover);
		color: var(--ink);
	}

	.icon.danger:hover {
		color: var(--error);
	}

	.fade {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 72px;
		background: linear-gradient(180deg, var(--bg) 45%, rgba(0, 0, 0, 0));
		pointer-events: none;
	}

	.status-wrap {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 20px;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.status {
		padding: 5px 10px;
		border-radius: 7px;
		background-color: var(--bg);
		color: var(--error);
		font-size: 12px;
		line-height: 18px;
	}

	.scrim {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.22);
		pointer-events: auto;
	}

	.dialog {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 340px;
		padding: 20px;
		border-radius: 12px;
		border-width: 1px;
		border-color: var(--hover);
		background-color: var(--bg);
		box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
	}

	.dialog-title {
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
	}

	.dialog-detail {
		color: var(--muted);
		font-size: 12px;
		line-height: 18px;
	}

	.dialog-actions {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		gap: 6px;
		padding-top: 8px;
	}

	.dialog-button {
		padding: 6px 14px;
		border-radius: 7px;
		background-color: var(--hover);
		font-size: 13px;
		cursor: pointer;
	}

	.dialog-button.danger {
		background-color: var(--error);
		color: var(--bg);
	}

	.fatal {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		background-color: var(--bg);
	}

	.fatal-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 544px;
	}

	.fatal-title {
		font-size: 20px;
		font-weight: 600;
		line-height: 28px;
	}

	.fatal-message {
		font-size: 14px;
		line-height: 21px;
	}

	.fatal-hint {
		color: var(--muted);
		font-size: 14px;
		line-height: 21px;
	}
</style>
