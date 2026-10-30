/// <reference types="bun" />
// `bun build.ts` compiles standalone.ts into one executable: the Bun runtime,
// Svelte and the GPUI addon. `--app` wraps it as Pereda.app on macOS.

import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BunPlugin } from 'bun';
import { load_module, load_svelte, resolve_native_cjs, resolve_svelte } from 'gpuix-svelte/plugin';

const root = fileURLToPath(new URL('./', import.meta.url));
const dist = join(root, 'dist');
const app = process.argv.includes('--app');
const binary = join(dist, process.platform === 'win32' ? 'Pereda.exe' : 'Pereda');
const bundle = join(dist, 'Pereda.app');
const icon = join(root, '..', 'assets', 'icon.png');

if (app && process.platform !== 'darwin') {
	console.error(`[build] --app wraps the binary in a macOS .app bundle; nothing to wrap on ${process.platform}`);
	process.exit(1);
}

const PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>Pereda</string>
	<key>CFBundleIconFile</key>
	<string>AppIcon</string>
	<key>CFBundleIdentifier</key>
	<string>se.aivara.pereda</string>
	<key>CFBundleName</key>
	<string>Pereda</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>LSMinimumSystemVersion</key>
	<string>15.0</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
`;

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.cs.allow-jit</key>
	<true/>
	<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
	<true/>
	<key>com.apple.security.cs.disable-executable-page-protection</key>
	<true/>
	<key>com.apple.security.cs.allow-dyld-environment-variables</key>
	<true/>
	<key>com.apple.security.cs.disable-library-validation</key>
	<true/>
</dict>
</plist>
`;

const conditions = ['custom-renderer', 'production'];
let components = 0;
const plugin: BunPlugin = {
	name: 'gpuix-svelte',
	setup(build) {
		build.onResolve({ filter: /^@gpuix\/native$/ }, resolve_native_cjs);
		build.onResolve({ filter: /^svelte(\/|$)/ }, resolve_svelte(conditions));
		build.onLoad({ filter: /\.svelte\.[jt]s$/ }, load_module);
		build.onLoad({ filter: /\.svelte$/ }, (args) => {
			components++;
			return load_svelte(args);
		});
	}
};

rmSync(binary, { force: true });
rmSync(bundle, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const result = await Bun.build({
	entrypoints: [join(root, 'standalone.ts')],
	target: 'bun',
	conditions,
	define: { 'process.env.NODE_ENV': '"production"' },
	minify: true,
	plugins: [plugin],
	throw: false,
	compile: {
		outfile: binary,
		autoloadBunfig: false,
		autoloadDotenv: false,
		...(process.platform === 'win32' && { windows: { hideConsole: true } })
	}
});

if (!result.success || components === 0) {
	for (const log of result.logs) console.error(log);
	if (components === 0) console.error('no .svelte file went through the plugin');
	process.exit(1);
}

const size = statSync(binary).size;
console.log(`[build] ${relative(root, binary)} (${(size / 1048576).toFixed(1)} MB)`);

if (app) {
	const macos = join(bundle, 'Contents', 'MacOS');
	const resources = join(bundle, 'Contents', 'Resources');
	mkdirSync(macos, { recursive: true });
	mkdirSync(resources, { recursive: true });
	copyFileSync(binary, join(macos, 'Pereda'));
	chmodSync(join(macos, 'Pereda'), 0o755);
	writeFileSync(join(bundle, 'Contents', 'Info.plist'), PLIST);
	write_icns(icon, join(resources, 'AppIcon.icns'));
	// No Developer ID in this POC: an ad-hoc signature is enough for the app to
	// launch on the machine that built it.
	run('codesign', ['--force', '--deep', '--sign', '-', bundle]);
	run('codesign', ['--verify', '--strict', bundle]);
	console.log(`[build] ${relative(root, bundle)} (ad-hoc signed)`);
}

function write_icns(png: string, out: string): void {
	const iconset = join(dist, 'AppIcon.iconset');
	rmSync(iconset, { recursive: true, force: true });
	mkdirSync(iconset);
	for (const points of [16, 32, 128, 256, 512]) {
		run('sips', ['-z', `${points}`, `${points}`, png, '--out', join(iconset, `icon_${points}x${points}.png`)]);
		run('sips', [
			'-z',
			`${points * 2}`,
			`${points * 2}`,
			png,
			'--out',
			join(iconset, `icon_${points}x${points}@2x.png`)
		]);
	}
	run('iconutil', ['-c', 'icns', iconset, '-o', out]);
	rmSync(iconset, { recursive: true, force: true });
}

function run(command: string, args: string[]): void {
	const { status, stdout, stderr } = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
	if (status !== 0) {
		console.error(`[build] ${command} ${args.join(' ')} failed:\n${stderr || stdout}`);
		process.exit(1);
	}
}
