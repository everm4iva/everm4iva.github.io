document.addEventListener('DOMContentLoaded', () => {
	const pfp = document.querySelector('.pfp-class');
	const player = document.querySelector('.audio-class');
	const audio = document.querySelector('.audio-element');
	const toggles = document.querySelectorAll('.play-toggle');
	const volume = document.querySelector('.audio-c-volume');
	const me = document.querySelector('.me');

	if (!audio) return;

	try {
		audio.volume = 0.5;
	} catch (e) {
		/* ignore */
	}

	function updateToggleIcons(isPlaying) {
		toggles.forEach((btn) => {
			try {
				btn.src = isPlaying
					? './media/images/commonicons/pause.white.svg'
					: './media/images/commonicons/play.white.svg';
				btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
			} catch (e) {}
		});
	}

	function showPlayer() {
		if (pfp) pfp.classList.add('hidden');
		if (player) player.classList.remove('hidden');
		if (me) me.classList.add('rock');
		audio.currentTime = 0;
		audio.play().catch(() => {});
		if (player) player.setAttribute('aria-hidden', 'false');
		updateToggleIcons(true);
	}

	function showProfile() {
		if (pfp) pfp.classList.remove('hidden');
		if (player) player.classList.add('hidden');
		if (me) me.classList.remove('rock');
		try {
			audio.pause();
		} catch (e) {}
		if (player) player.setAttribute('aria-hidden', 'true');
		updateToggleIcons(false);
	}

	toggles.forEach((btn) =>
		btn.addEventListener('click', (e) => {
			if (audio.paused || audio.ended) {
				showPlayer();
			} else {
				audio.pause();
			}
		}),
	);

	audio.addEventListener('ended', showProfile);

	audio.addEventListener('pause', () => {
		setTimeout(() => {
			if (audio.paused && !audio.ended) {
				showProfile();
			}
		}, 0);
	});

	// Volume control
	if (volume) {
		volume.value = typeof audio.volume === 'number' ? audio.volume.toString() : '0.8';
		volume.addEventListener('input', (e) => {
			const v = parseFloat(e.target.value);
			if (!Number.isNaN(v)) audio.volume = Math.min(1, Math.max(0, v));
		});

		audio.addEventListener('volumechange', () => {
			const cur = parseFloat(volume.value);
			if (Math.abs(cur - audio.volume) > 0.01) volume.value = audio.volume.toString();
		});
	}
});
