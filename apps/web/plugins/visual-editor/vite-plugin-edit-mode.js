import { resolve } from 'path';
import { build } from 'rolldown';
import { fileURLToPath } from 'url';
import { EDIT_MODE_STYLES } from './ui/inline-edit/styles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

async function bundleEditModeScript() {
	const { output } = await build({
		input: resolve(__dirname, 'edit-mode-script.js'),
		platform: 'browser',
		transform: { target: 'es2020' },
		write: false,
		output: { format: 'esm', sourcemap: 'inline' },
	});
	return output[0].code;
}

/**
 * Bundles the multi-file contenteditable edit-mode runtime with Rolldown and
 * injects it (plus the edit-mode styles) into the dev preview HTML.
 *
 * @returns {import('vite').Plugin}
 */
export default function inlineEditDevPlugin() {
	return {
		name: 'vite:inline-edit-dev',
		apply: 'serve',

		async transformIndexHtml() {
			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: await bundleEditModeScript(),
					injectTo: 'body',
				},
				{
					tag: 'style',
					children: EDIT_MODE_STYLES,
					injectTo: 'head',
				},
			];
		},
	};
}
