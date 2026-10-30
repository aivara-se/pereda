/**
 * Read by the editor and svelte-check, not at runtime: DOM a11y advice off, since this tree has
 * no DOM.
 */
export default {
	compilerOptions: {
		warningFilter: (warning) => !warning.code.startsWith('a11y_')
	}
};
