/**
 * ☆=========================================☆
 * rad.data.js - load + normalize json sources
 * ☆=========================================☆
 */

// tiny fetch helper

const try_fetch_json = async (url) => {
	const res = await fetch(url, {cache: 'no-cache'});
	if (!res.ok) throw new Error(`http ${res.status} for ${url}`);
	return res.json();
};

export const load_media_manifest = async () => {
	// try common roots
	const tries = ['./media.json', '/rad/media.json', '/media.json'];
	let last_err;

	for (const url of tries) {
		try {
			const json = await try_fetch_json(url);
			return {url, json};
		} catch (err) {
			last_err = err;
		}
	}

	throw last_err ?? new Error('failed to load media.json');
};

const resolve_url = (maybe_url, base_url) => {
	try {
		return new URL(String(maybe_url), base_url).toString();
	} catch {
		return String(maybe_url);
	}
};

const guess_kind = (url) => {
	const u = String(url ?? '')
		.toLowerCase()
		.trim();
	return u.endsWith('.json') ? 'folder' : 'file';
};

export const parse_manifest_entries = (manifest_json, manifest_url) => {
	// normalize into: [{ name, kind, url }]
	const entries = [];
	const base_url = new URL(manifest_url ?? window.location.href, window.location.href);
	const push_entry = (name, url) => {
		if (!name || !url) return;
		const resolved = resolve_url(url, base_url);
		entries.push({name: String(name), kind: guess_kind(resolved), url: resolved});
	};

	if (Array.isArray(manifest_json)) {
		for (const node of manifest_json) {
			if (!node || typeof node !== 'object') continue;
			for (const key of Object.keys(node)) {
				const val = node[key];
				if (Array.isArray(val)) {
					for (const item of val) {
						if (!item || typeof item !== 'object') continue;
						for (const n of Object.keys(item)) push_entry(n, item[n]);
					}
				} else if (val && typeof val === 'object') {
					for (const n of Object.keys(val)) push_entry(n, val[n]);
				}
			}
		}
	} else if (manifest_json && typeof manifest_json === 'object') {
		for (const n of Object.keys(manifest_json)) push_entry(n, manifest_json[n]);
	}

	return entries;
};

export const load_folder_info = async (info_url) => {
	// accepts array or object
	const json = await try_fetch_json(info_url);
	const folder = Array.isArray(json) ? json[0] : json;

	if (!folder || typeof folder !== 'object') {
		throw new Error(`bad info json: ${info_url}`);
	}

	const name = folder.name ?? 'folder';
	const path = folder.path ?? null;
	const type = folder.type ?? 'folder';
	const color = folder.color ?? 'cyan';
	const view = folder.view ?? 'list';
	const icon = folder.icon ?? 'folder';
	const content = folder.content ?? {};

	return {
		info_url,
		name: String(name),
		path: path == null ? null : String(path),
		type: String(type),
		color: String(color),
		view: String(view),
		icon: String(icon),
		content,
	};
};

const get_base_url = (url) => {
	const u = new URL(url, window.location.href);
	u.pathname = u.pathname.split('/').slice(0, -1).join('/') + '/';
	u.search = '';
	u.hash = '';
	return u;
};

export const flatten_folder_items = (folder) => {
	// flattens the "files" groups into rows
	const items = [];
	const base = get_base_url(folder.info_url);

	const file_groups = folder?.content?.files;
	if (!Array.isArray(file_groups)) return items;

	for (const group of file_groups) {
		if (!group || typeof group !== 'object') continue;

		for (const key of Object.keys(group)) {
			const arr = group[key];
			if (!Array.isArray(arr)) continue;

			for (const raw of arr) {
				if (!raw || typeof raw !== 'object') continue;
				const title = raw.title ?? key;
				const file = raw.file;
				const thumb = raw.thumbnail ?? raw.thumbail;

				items.push({
					kind: 'file',
					title: String(title),
					description: raw.description,
					duration: raw.duration,
					size: raw.size,
					file_url: file ? new URL(String(file), base).toString() : null,
					thumb,
					raw,
				});
			}
		}
	}

	return items;
};
