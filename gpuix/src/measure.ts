// How many rows a note needs at a given column width.
//
// GPUI's textarea takes its height in rows and does not report the height its
// text wrapped to, so the page measures the same face with the same metrics the
// textarea draws it in. A wrapped line is a line at the textarea's line height.

import { create, type Font } from 'fontkit';
import { NEWSREADER_BASE64 } from './fonts.ts';

const SIZE = 19;
const LINE = 31.35;

let font: Font | null = null;
const cache = new Map<string, number>();

export function noteRows(text: string, width: number): number {
	return Math.max(1, Math.ceil(wrapped(text, Math.max(40, width))));
}

export function noteHeight(text: string, width: number): number {
	return noteRows(text, width) * LINE;
}

function face(): Font {
	if (font === null) font = create(Buffer.from(NEWSREADER_BASE64, 'base64'));
	return font;
}

function measure(word: string): number {
	const shaped = face();
	return shaped.layout(word).advanceWidth * (SIZE / shaped.unitsPerEm);
}

function wrapped(text: string, width: number): number {
	const key = `${width}:${text}`;
	const known = cache.get(key);
	if (known !== undefined) return known;

	const space = measure(' ');
	let lines = 0;
	for (const paragraph of text.split('\n')) {
		lines += paragraphLines(paragraph, width, space);
	}

	// The cache only has to hold the notes on screen; a long session should not
	// keep every version of every note it ever measured.
	if (cache.size > 500) cache.clear();
	cache.set(key, lines);
	return lines;
}

function paragraphLines(paragraph: string, width: number, space: number): number {
	if (paragraph === '') return 1;

	let lines = 1;
	let current = 0;
	for (const word of paragraph.split(' ')) {
		const wordWidth = measure(word);
		if (current > 0 && current + space + wordWidth > width) {
			lines++;
			current = 0;
		}
		if (wordWidth > width) {
			// A word wider than the column breaks inside itself; count the pieces
			// it needs rather than letting it overflow the box.
			const pieces = Math.ceil(wordWidth / width);
			lines += pieces - 1;
			current = wordWidth - (pieces - 1) * width;
			continue;
		}
		current += (current > 0 ? space : 0) + wordWidth;
	}
	return lines;
}
