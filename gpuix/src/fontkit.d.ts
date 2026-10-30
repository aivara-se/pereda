// Just the slice of fontkit the note measurement uses; the package ships no
// types under nodenext.
declare module 'fontkit' {
	export type Font = {
		unitsPerEm: number;
		layout(text: string): { advanceWidth: number };
	};
	export function create(bytes: Uint8Array): Font;
}
