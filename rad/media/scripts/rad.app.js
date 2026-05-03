/**
 * ☆=========================================☆
 * rad.app.js - app glue for rad explorer
 * ☆=========================================☆
 */

import {flatten_folder_items, load_folder_info, load_media_manifest, parse_manifest_entries} from './rad.data.js';

import {
	map_entries_to_root_rows,
	map_folder_items_to_rows,
	render_filelist,
	render_places,
	ui_bind,
	ui_set_view,
	ui_status,
	ui_top,
} from './rad.ui.js';

import {bind_previewhost, preview_init_drag, preview_set} from './rad.previewhost.js';

const state = {
	// runtime state
	entries: [],
	active_place: null,
	active_folder: null,
	view: 'list',
	preview: null,
};

const fmt_root_path = () => 'rad\\';

const fmt_path = (path) => {
	const p = String(path ?? '').replaceAll('/', '\\');
	if (!p) return fmt_root_path();
	return p.endsWith('\\') ? p : `${p}\\`;
};

const init_root = (ui) => {
	// root view: just the manifest entries
	state.active_place = null;
	state.active_folder = null;
	state.view = 'list';

	render_places(ui, state.entries, null, (entry) => open_place(ui, entry));
	render_filelist(ui, map_entries_to_root_rows(state.entries), {
		accent: 'var(--pink)',
		show_up: false,
		on_open: (row) => {
			if (row.kind === 'folder') {
				const entry =
					state.entries.find((e) => e.kind === 'folder' && e.url && row.url && e.url === row.url) ||
					state.entries.find((e) => e.name === row.title);
				if (!entry) return;
				open_place(ui, entry);
				return;
			}

			if (row.url) preview_set(state.preview, {src: row.url, title: row.title, meta: row.meta});
		},
	});

	ui_set_view(ui, 'list');
	ui_top(ui, 'rad /', fmt_root_path());
	ui_status(ui, `${state.entries.length} items`, 'selected: root', 'ready');
};

const open_place = async (ui, entry) => {
	// load info.json + render its items
	state.active_place = entry;
	ui_status(ui, 'loading...', `selected: ${entry.name}`, 'wait');

	try {
		if (entry.kind && entry.kind !== 'folder') {
			if (entry.url) preview_set(state.preview, {src: entry.url, title: entry.name, meta: 'file'});
			return;
		}

		const folder = await load_folder_info(entry.url);
		state.active_folder = folder;
		state.view = folder.view ?? 'list';

		const items = flatten_folder_items(folder);
		const rows = map_folder_items_to_rows(folder, items);

		// used for thumbnail fallback (relative to .info dir)
		const info_base = new URL(folder.info_url, window.location.href);
		info_base.pathname = info_base.pathname.split('/').slice(0, -1).join('/') + '/';

		render_places(ui, state.entries, entry.name, (e) => open_place(ui, e));
		render_filelist(ui, rows, {
			accent: 'var(--cyan)',
			show_up: true,
			on_up: () => init_root(ui),
			thumb_base_url: info_base.toString(),
			on_open: (row) => {
				if (row.file_url) {
					preview_set(state.preview, {src: row.file_url, title: row.title, meta: row.meta});
				}
			},
		});

		ui_set_view(ui, state.view);
		ui_top(ui, `rad / ${folder.name} /`, fmt_path(folder.path ?? folder.name));
		ui_status(ui, `${rows.length} items`, `selected: ${folder.name}`, 'ready');
	} catch (err) {
		ui_status(ui, '0 items', `selected: ${entry.name}`, 'err');
		render_filelist(ui, [], {show_up: true, on_up: () => init_root(ui)});
		ui_top(ui, `rad / ${entry.name} /`, fmt_path(entry.name));
		console.error(err);
	}
};

const boot = async () => {
	// start
	const ui = ui_bind();
	state.preview = bind_previewhost();
	preview_init_drag(state.preview);
	ui_status(ui, 'loading...', 'selected: root', 'wait');
	ui_top(ui, 'rad /', fmt_root_path());

	try {
		const {url, json} = await load_media_manifest();
		state.entries = parse_manifest_entries(json, url);
		init_root(ui);
	} catch (err) {
		ui_status(ui, '0 items', 'selected: root', 'err');
		render_filelist(ui, [], {show_up: false});
		console.error(err);
	}
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', boot);
} else {
	boot();
}
