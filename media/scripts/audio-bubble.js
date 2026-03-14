/**
 * ☆=========================================☆
 * Audio Bubble - LOGIC
 * That note bubble on my profile (index page)...
 * ☆=========================================☆
*/

document.addEventListener('DOMContentLoaded', () => {
	const pfp = document.querySelector('.pfp-class');
	const player = document.querySelector('.audio-class');
	const audio = document.querySelector('.audio-element');
	const toggles = document.querySelectorAll('.play-toggle');
	const volume = document.querySelector('.audio-c-volume');
	const me = document.querySelector('.me');

	// Audio player elements for updating UI
	const audioTitle = document.querySelector('.audio-title');
	const audioArtist = document.querySelector('.audio-artist');
	const audioCover = document.querySelector('.audio-cover');

	if (!audio) return;

	let musicLibrary = [];
	let currentTrack = null;

	window.updateAudioNoteDisplay = function(track) {
		updateAudioDisplay(track);
	};

	async function loadMusicLibrary() {
		try {
			const response = await fetch('./media/json/music.json');
			const data = await response.json();
			musicLibrary = Object.entries(data[0]['music-panel'].library).map(([key, track]) => track);
			console.log('Audio bubble: Music library loaded with', musicLibrary.length, 'tracks');
		} catch (error) {
			console.error('Failed to load music library:', error);
		}
	}

	function getRandomTrack() {
		if (musicLibrary.length === 0) {
			// console.warn('musicLibrary is empty, cannot select random track');
			return null;
		}
		const randomIndex = Math.floor(Math.random() * musicLibrary.length);
		const track = musicLibrary[randomIndex];
		// console.log('getRandomTrack: selected index', randomIndex, 'from', musicLibrary.length, 'tracks');
		console.log('Selected track:', track);
		return track;
	}

	function updateAudioDisplay(track) {
		if (!track) {
			// console.warn('updateAudioDisplay called with no track');
			return;
		}

		// console.log('updateAudioDisplay called for:', track.title);
		console.log('Elements - audioTitle:', !!audioTitle, 'audioArtist:', !!audioArtist, 'audioCover:', !!audioCover);

		currentTrack = track;
		window.currentAudioBubbleTrack = track;

		if (audioTitle) {
			audioTitle.textContent = track.title;
			console.log('Updated audioTitle to:', audioTitle.textContent);
		}
		if (audioArtist) {
			audioArtist.textContent = `by ${track.artist}`;
			console.log('Updated audioArtist to:', audioArtist.textContent);
		}

		if (audioCover) {
			audioCover.src = track.cover;
			console.log('Updated audioCover.src to:', audioCover.src);
		}

		const trackColor = track.color || '#1c0902';
		const trackLightMode = track.lightMode || false;
		const textColor = trackLightMode ? '#000000' : '#ffffff';

		const absoluteCoverUrl = new URL(track.cover, window.location.href).href;
		const imageUrlStr = `url('${absoluteCoverUrl}')`;
		document.documentElement.style.setProperty('--audionote-image', imageUrlStr);
		document.documentElement.style.setProperty('--audionote-color', trackColor);
		document.documentElement.style.setProperty('--audionote-text-color', textColor);
		
		// console.log('CSS variables updated - color:', trackColor, 'lightMode:', trackLightMode);
	}

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
		console.log('showPlayer called');
		if (pfp) pfp.classList.add('hidden');
		if (player) player.classList.remove('hidden');
		if (me) me.classList.add('rock');

		const randomTrack = getRandomTrack();
		// console.log('Random track selected:', randomTrack);
		
		if (randomTrack) {
			audio.src = randomTrack['music-src'];
			// console.log('Audio source set to:', audio.src);
			updateAudioDisplay(randomTrack);

			if (window.effectSystem) {
				window.effectSystem.applyEffects(randomTrack);
			}
		} else {
			// console.warn('No random track found');
		}

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

	loadMusicLibrary().then(() => {
		//console.log('Audio bubble: Music library loaded.');
	});
});
