/**
 * ☆=========================================☆
 * rad.preview.js - barebones file preview
 * ☆=========================================☆
 */

const $ = (id) => document.getElementById(id);

const pv = {
	title: $('pvTitle'),
	meta: $('pvMeta'),
	body: $('pvBody'),
	raw: $('pvRaw'),
	copy: $('pvCopy'),
	dl: $('pvDl'),
};

const esc = (v) => String(v ?? '');

const get_ext = (url) => {
	try {
		const u = new URL(url, window.location.href);
		const name = u.pathname.split('/').pop() ?? '';
		const idx = name.lastIndexOf('.');
		if (idx === -1) return '';
		return name.slice(idx + 1).toLowerCase();
	} catch {
		const s = String(url ?? '');
		const name = s.split('/').pop() ?? '';
		const idx = name.lastIndexOf('.');
		if (idx === -1) return '';
		return name.slice(idx + 1).toLowerCase();
	}
};

const set_txt = (node, txt) => {
	if (!node) return;
	node.textContent = txt == null ? '' : String(txt);
};

const clear = () => {
	if (pv.body) pv.body.innerHTML = '';
};

const mk_box = (cls) => {
	const d = document.createElement('div');
	d.className = `pv-box ${cls ?? ''}`.trim();
	return d;
};

const mk_pre = (text) => {
	const pre = document.createElement('pre');
	pre.className = 'pv-pre';
	pre.textContent = text;
	return pre;
};

const md_inline = (s) => {
	return esc(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
};

const md_to_html = (md) => {
	const lines = String(md ?? '')
		.replaceAll('\r\n', '\n')
		.split('\n');
	let html = '';
	let in_code = false;
	let code_buf = [];
	let in_list = false;

	const flush_code = () => {
		if (!in_code) return;
		const code = code_buf.join('\n').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
		html += `<div class="pv-box"><pre class="pv-pre">${code}</pre></div>`;
		in_code = false;
		code_buf = [];
	};

	const close_list = () => {
		if (!in_list) return;
		html += '</ul>';
		in_list = false;
	};

	for (const raw of lines) {
		const line = raw ?? '';
		if (line.trim().startsWith('```')) {
			if (in_code) flush_code();
			else {
				close_list();
				in_code = true;
			}
			continue;
		}

		if (in_code) {
			code_buf.push(line);
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			if (!in_list) {
				in_list = true;
				html += '<ul>';
			}
			const item = line.replace(/^\s*[-*]\s+/, '');
			html += `<li>${md_inline(item)}</li>`;
			continue;
		}

		close_list();

		if (line.startsWith('### ')) html += `<h3>${md_inline(line.slice(4))}</h3>`;
		else if (line.startsWith('## ')) html += `<h2>${md_inline(line.slice(3))}</h2>`;
		else if (line.startsWith('# ')) html += `<h1>${md_inline(line.slice(2))}</h1>`;
		else if (line.trim().length === 0) html += '';
		else html += `<p>${md_inline(line)}</p>`;
	}

	flush_code();
	close_list();
	return html;
};

const render_text = async (src, mode) => {
	const res = await fetch(src, {cache: 'no-cache'});
	const text = await res.text();

	if (mode === 'md') {
		const box = mk_box('pv-md');
		box.innerHTML = md_to_html(text);
		pv.body?.append(box);
		return;
	}

	const box = mk_box();
	box.append(mk_pre(text));
	pv.body?.append(box);
};

const render_media = (tag, src) => {
	const box = mk_box();
	const node = document.createElement(tag);
	node.controls = true;
	node.src = src;
	node.style.width = '100%';
	node.style.maxHeight = '70vh';
	box.append(node);
	pv.body?.append(box);
};

const render_img = (src) => {
	const box = mk_box();
	const img = document.createElement('img');
	img.src = src;
	img.alt = 'preview';
	img.style.width = '100%';
	img.style.height = 'auto';
	box.append(img);
	pv.body?.append(box);
};

const render_embed = (src) => {
	const box = mk_box();
	const fr = document.createElement('iframe');
	fr.src = src;
	fr.style.width = '100%';
	fr.style.height = '70vh';
	fr.style.border = '0';
	box.append(fr);
	pv.body?.append(box);
};

const set_actions = (src, name) => {
	if (pv.raw) pv.raw.href = src;
	if (pv.dl) {
		pv.dl.href = src;
		pv.dl.download = name || '';
	}

	pv.copy?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(src);
			set_txt(pv.meta, `${pv.meta?.textContent ?? ''}`.replace(/\s*\|\s*copied.*/i, '') + ' | copied');
		} catch {
			const ta = document.createElement('textarea');
			ta.value = src;
			ta.style.position = 'fixed';
			ta.style.left = '-9999px';
			document.body.append(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
			set_txt(pv.meta, `${pv.meta?.textContent ?? ''}`.replace(/\s*\|\s*copied.*/i, '') + ' | copied');
		}
	});
};

const boot = async () => {
	const qp = new URLSearchParams(window.location.search);
	const src = qp.get('src');
	const title = qp.get('title');
	const meta = qp.get('meta');

	clear();
	set_txt(pv.title, title || 'preview');
	set_txt(pv.meta, meta || '');

	if (!src) {
		const box = mk_box();
		box.append(mk_pre('no file selected'));
		pv.body?.append(box);
		return;
	}

	const ext = get_ext(src);
	const name = title || src.split('/').pop() || 'file';
	set_actions(src, name);

	try {
		if (['mp4', 'webm', 'ogg'].includes(ext)) {
			render_media('video', src);
			return;
		}
		if (['mp3', 'wav', 'flac', 'm4a', 'oga'].includes(ext)) {
			render_media('audio', src);
			return;
		}
		if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
			render_img(src);
			return;
		}
		if (['pdf'].includes(ext)) {
			render_embed(src);
			return;
		}
		if (['md', 'markdown'].includes(ext)) {
			await render_text(src, 'md');
			return;
		}

		await render_text(src, 'text');
	} catch (err) {
		const box = mk_box();
		box.append(mk_pre(`failed to preview\n${String(err?.message ?? err)}`));
		pv.body?.append(box);
	}
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
