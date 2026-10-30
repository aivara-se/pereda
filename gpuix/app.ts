import { render_hot } from 'gpuix-svelte';
render_hot(new URL('./App.svelte', import.meta.url), {
	title: 'Pereda',
	width: 1080,
	height: 720
});
