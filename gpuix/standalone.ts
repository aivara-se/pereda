// The entry `bun run build` compiles: a binary carries no source to hot-reload,
// so it imports the component statically and mounts it with `render`.
import { render } from 'gpuix-svelte';
import App from './App.svelte';
render(App, {
	title: 'Pereda',
	width: 1080,
	height: 720
});
