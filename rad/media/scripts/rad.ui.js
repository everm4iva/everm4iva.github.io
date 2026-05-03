/**
 * ☆=========================================☆
 * rad.ui.js - render explorer ui
 * ☆=========================================☆
 */

// dom bits

const el = (tag, cls) => {
	const node = document.createElement(tag);
	if (cls) node.className = cls;
	return node;
};

const set_txt = (node, txt) => {
	node.textContent = txt == null ? '' : String(txt);
};

const color_to_var = (color) => {
	// maps json color -> css var
	const c = String(color ?? '')
		.toLowerCase()
		.trim();
	if (c === 'pink') return 'var(--pink)';
	if (c === 'purple' || c === 'neon-purple') return 'var(--neon-purple)';
	if (c === 'yellow') return 'var(--yellow)';
	if (c === 'green') return 'var(--green)';
	return 'var(--cyan)';
};

export const ui_bind = () => {
	const q = (id) => document.getElementById(id);
	return {
		path: q('fxPath'),
		crumbs: q('fxCrumbs'),
		view: q('fxView'),
		places: q('fxPlaces'),
		filelist: q('fxFilelist'),
		st_left: q('fxStatusLeft'),
		st_mid: q('fxStatusMid'),
		st_right: q('fxStatusRight'),
	};
};

export const ui_status = (ui, left, mid, right) => {
	if (ui.st_left) set_txt(ui.st_left, left);
	if (ui.st_mid) set_txt(ui.st_mid, mid);
	if (ui.st_right) set_txt(ui.st_right, right);
};

export const ui_top = (ui, crumbs, path) => {
	if (ui.crumbs) set_txt(ui.crumbs, crumbs);
	if (ui.path) set_txt(ui.path, path);
};

export const ui_set_view = (ui, view) => {
	if (!ui.view) return;
	set_txt(ui.view, `view: ${String(view ?? 'list').toUpperCase()}`);
};

export const render_places = (ui, entries, active_name, on_pick) => {
	if (!ui.places) return;
	ui.places.innerHTML = '';

	for (const entry of entries) {
		if (entry.kind && entry.kind !== 'folder') continue;
		const item = el('div', 'fx-item');
		item.setAttribute('role', 'listitem');
		if (entry.name === active_name) item.classList.add('selected');

		const icon = el('div', 'fx-item-icon');
		icon.setAttribute('aria-hidden', 'true');

		const info = el('div', 'fx-item-info');
		const title = el('div', 'fx-item-title');
		const status = el('div', 'fx-item-status');
		set_txt(title, entry.name);
		set_txt(status, 'folder');

		info.append(title, status);
		item.append(icon, info);

		item.addEventListener('click', () => on_pick(entry));
		ui.places.append(item);
	}
};

const mk_meta = (obj) => {
	// compact meta line
	const parts = [];
	if (obj.kind) parts.push(obj.kind);
	if (obj.duration) parts.push(obj.duration);
	if (obj.size) parts.push(obj.size);
	return parts.join(' • ');
};

const thumb_urls = (thumb, base_url) => {
	if (!thumb) return null;
	const file = encodeURIComponent(String(thumb));
	const primary = `./media/thumbail/${file}`;
	if (!base_url) return primary;
	return [primary, new URL(String(thumb), base_url).toString()];
};

export const render_filelist = (ui, rows, opts) => {
	if (!ui.filelist) return;
	ui.filelist.innerHTML = '';

	const {accent, show_up, on_up, on_open, thumb_base_url} = opts ?? {};
	const acc = accent ?? 'var(--cyan)';

	if (show_up) {
		const up = el('div', 'fx-row is-up');
		up.setAttribute('role', 'listitem');
		up.style.setProperty('--fx-accent', 'var(--yellow)');

		const icon = el('div', 'fx-row-icon');
		icon.setAttribute('aria-hidden', 'true');
		const main = el('div', 'fx-row-main');
		const line = el('div', 'fx-row-line');
		const title = el('div', 'fx-row-title');
		const meta = el('div', 'fx-row-meta');
		set_txt(title, '../');
		set_txt(meta, 'up');

		line.append(title, meta);
		main.append(line);
		up.append(icon, main);
		up.addEventListener('click', () => on_up?.());
		ui.filelist.append(up);
	}

	for (const row of rows) {
		const kind = row.kind === 'folder' ? 'is-folder' : 'is-file';
		const node = el('div', `fx-row ${kind}`);
		node.setAttribute('role', 'listitem');
		node.style.setProperty('--fx-accent', row.accent ?? acc);

		const icon = el('div', 'fx-row-icon');
		icon.setAttribute('aria-hidden', 'true');

		const turl = thumb_urls(row.thumb, thumb_base_url);
		if (typeof turl === 'string') {
			icon.style.backgroundImage = `url('${turl}')`;
		} else if (Array.isArray(turl)) {
			icon.style.backgroundImage = `url('${turl[0]}'), url('${turl[1]}')`;
		}

		const main = el('div', 'fx-row-main');
		const line = el('div', 'fx-row-line');
		const title = el('div', 'fx-row-title');
		const meta = el('div', 'fx-row-meta');
		set_txt(title, row.title);
		set_txt(meta, row.meta ?? mk_meta(row));

		line.append(title, meta);
		main.append(line);
		if (row.sub) {
			const sub = el('div', 'fx-row-sub');
			set_txt(sub, row.sub);
			main.append(sub);
		}
		node.append(icon, main);

		node.addEventListener('click', () => on_open?.(row));
		ui.filelist.append(node);
	}
};

export const map_folder_items_to_rows = (folder, items) => {
	// keeps extra fields customizable via json
	const accent = color_to_var(folder.color);
	return items.map((it) => {
		const meta = [];
		meta.push(folder.type ?? 'media');
		if (it.duration) meta.push(it.duration);
		if (it.size) meta.push(it.size);
		const sub =
			it.description && String(it.description).trim() && String(it.description).trim() !== String(it.title)
				? String(it.description)
				: null;

		return {
			kind: 'file',
			title: it.title,
			meta: meta.join(' • '),
			sub,
			thumb: it.thumb,
			file_url: it.file_url,
			accent,
			raw: it.raw,
		};
	});
};

export const map_entries_to_root_rows = (entries) => {
	return entries.map((e) => {
		const kind = e.kind ?? 'folder';
		const meta = kind === 'folder' ? 'folder' : 'file';
		const accent = kind === 'folder' ? 'var(--pink)' : 'var(--cyan)';
		return {kind, title: e.name, meta, accent, url: e.url};
	});
};
