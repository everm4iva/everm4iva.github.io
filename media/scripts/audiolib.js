/**
 * ☆=========================================☆
 * Audio Lib - LOGIC
 * Dealing with music players is kinda tricky, ngl
 * ☆=========================================☆
 */

document.addEventListener('DOMContentLoaded', async () => {
	// console.log('audiolib.js DOMContentLoaded handler started');
	const musicPanel = document.querySelector('.music-panel');
	const mpList = document.querySelector('.mp-list');
	const mpMusicTitle = document.querySelector('.mp-music-title');
	const mpMusicArtist = document.querySelector('.mp-music-artist');
	const mpMusicCoverImage = document.querySelector('.mp-music-cover-image');
	const mpVolume = document.querySelector('.mp-volume');
	const mpBtnPlay = document.querySelector('.mp-btn-play');
	const mpBtnPause = document.querySelector('.mp-btn-pause');
	const mpBtnLink = document.querySelector('.mp-btn-link');
	const mpBtnClose = document.querySelector('.mp-btn-close');
	const audioQueBtn = document.querySelector('.audio-btn[alt="Open Music Panel"]');

	const audio = document.querySelector('.audio-element');

	// console.log('Selectors found:');
	// console.log('  musicPanel:', !!musicPanel);
	// console.log('  mpList:', !!mpList);
	// console.log('  mpMusicTitle:', !!mpMusicTitle);
	// console.log('  mpMusicArtist:', !!mpMusicArtist);
	// console.log('  mpMusicCoverImage:', !!mpMusicCoverImage);
	// console.log('  mpVolume:', !!mpVolume);
	// console.log('  mpBtnPlay:', !!mpBtnPlay);
	// console.log('  mpBtnPause:', !!mpBtnPause);
	// console.log('  mpBtnLink:', !!mpBtnLink);
	// console.log('  mpBtnClose:', !!mpBtnClose);
	// console.log('  audioQueBtn:', !!audioQueBtn);
	// console.log('  audio:', !!audio);

	if (!musicPanel || !audio) {
		console.error('CRITICAL: musicPanel or audio element not found!');
		return;
	}

	let currentTrack = null;
	let tracks = [];

	// Load music from JSON
	async function loadMusicLibrary() {
		try {
			const response = await fetch('./media/json/music.json');
			const data = await response.json();
			tracks = Object.entries(data[0]['music-panel'].library).map(([key, track]) => track);
			console.log('Loaded', tracks.length, 'tracks');
		} catch (error) {
			console.error('Failed to load music library:', error);
		}
	}

	function updateIconTheme(lightMode = false) {
		const iconTheme = lightMode ? 'black' : 'white';
		const oppositeTheme = lightMode ? 'white' : 'black';
		const iconMap = {
			'mp-btn-play': 'play',
			'mp-btn-pause': 'pause',
			'mp-btn-link': 'link.diagonal',
			'mp-btn-close': 'close',
		};

		for (const [btnClass, iconName] of Object.entries(iconMap)) {
			const btn = document.querySelector(`.${btnClass}`);
			if (btn) {
				const oldSrc = btn.src;
				const newSrc = oldSrc.replace(new RegExp(`\\.${oppositeTheme}(\\.svg)$`), `.${iconTheme}$1`);
				btn.src = newSrc;
				// console.log(`Updated ${btnClass} icon: ${oppositeTheme} -> ${iconTheme}`);
			}
		}
	}

	function updateTrackImage(imageUrl, colorHex = '#1c0902', lightMode = false, animate = false) {
		const absoluteImageUrl = new URL(imageUrl, window.location.href).href;
		const imageUrlStr = `url('${absoluteImageUrl}')`;

		if (animate && mpMusicCoverImage) {
			mpMusicCoverImage.classList.remove('changing-in');
			mpMusicCoverImage.classList.add('changing-out');

			setTimeout(() => {
				document.documentElement.style.setProperty('--audionote-image', imageUrlStr);
				mpMusicCoverImage.style.backgroundImage = imageUrlStr;

				mpMusicCoverImage.classList.remove('changing-out');
				mpMusicCoverImage.classList.add('changing-in');

				setTimeout(() => {
					mpMusicCoverImage.classList.remove('changing-in');
				}, 300);
			}, 300);
		} else {
			document.documentElement.style.setProperty('--audionote-image', imageUrlStr);

			if (mpMusicCoverImage) {
				mpMusicCoverImage.style.backgroundImage = imageUrlStr;
			}
		}

		document.documentElement.style.setProperty('--audionote-color', colorHex);

		const textColor = lightMode ? '#000000' : '#ffffff';
		document.documentElement.style.setProperty('--audionote-text-color', textColor);
		// console.log('Track text color set to:', textColor, 'for lightMode:', lightMode);

		if (musicPanel) {
			musicPanel.style.backgroundColor = colorHex;
		}
	}

	function populateTracklist() {
		mpList.innerHTML = '';
		tracks.forEach((track, index) => {
			const listItem = document.createElement('div');
			listItem.className = 'mp-list-item';
			listItem.innerHTML = `
				<div class="mp-list-item-cover" style="background-image: url('${track.cover}')"></div>
				<div class="mp-list-item-details">
					<div class="mp-list-item-title">${track.title}</div>
					<div class="mp-list-item-artist">${track.artist}</div>
					<div class="mp-list-item-genre">${track.genre}</div>
				</div>
			`;
			listItem.addEventListener('click', () => selectTrack(index));
			mpList.appendChild(listItem);
		});
	}

	function selectTrack(index) {
		const track = tracks[index];
		if (!track) {
			console.warn('Track not found at index:', index);
			return;
		}

		//console.log('selectTrack called for:', track.title, 'Effects:', track.effects);

		currentTrack = track;
		const currentSrc = audio.src || '';
		const trackSrc = new URL(track['music-src'], window.location.href).href;
		const isSameTrack = currentSrc === trackSrc;
		const isAlreadyPlaying = isSameTrack && !audio.paused;

		console.log('isSameTrack:', isSameTrack, 'isAlreadyPlaying:', isAlreadyPlaying);
		console.log('currentSrc:', currentSrc);
		console.log('trackSrc:', trackSrc);

		const shouldAnimate = audio.src !== '' && !isSameTrack;
		if (shouldAnimate) {
			mpMusicTitle.classList.add('changing-out');
			mpMusicArtist.classList.add('changing-out');

			setTimeout(() => {
				mpMusicTitle.textContent = track.title;
				mpMusicArtist.textContent = `by ${track.artist}`;

				mpMusicTitle.classList.remove('changing-out');
				mpMusicTitle.classList.add('changing-in');

				mpMusicArtist.classList.remove('changing-out');
				mpMusicArtist.classList.add('changing-in');

				setTimeout(() => {
					mpMusicTitle.classList.remove('changing-in');
					mpMusicArtist.classList.remove('changing-in');
				}, 400);
			}, 300);
		} else {
			mpMusicTitle.textContent = track.title;
			mpMusicArtist.textContent = `by ${track.artist}`;
		}

		if (!isSameTrack) {
			audio.src = track['music-src'];
		}

		const trackColor = track.color || '#1c0902';
		const trackLightMode = track.lightMode || false;
		updateTrackImage(track.cover, trackColor, trackLightMode, shouldAnimate);

		updateIconTheme(trackLightMode);
		const listItems = document.querySelectorAll('.mp-list-item');
		listItems.forEach((item, i) => {
			item.classList.toggle('active', i === index);
		});

		if (listItems[index]) {
			listItems[index].scrollIntoView({behavior: 'smooth', block: 'nearest'});
		}

		if (window.effectSystem) {
			console.log('Calling applyEffects from selectTrack');
			window.effectSystem.applyEffects(track);
		} else {
			console.warn('effectSystem not available');
		}

		if (window.updateAudioNoteDisplay) {
			window.updateAudioNoteDisplay(track);
		}

		if (!isAlreadyPlaying) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		}
		updatePlayPauseIcons(!audio.paused);
	}

	function updatePlayPauseIcons(isPlaying) {
		if (mpBtnPlay) {
			mpBtnPlay.style.opacity = isPlaying ? '0.5' : '1';
			mpBtnPlay.style.pointerEvents = isPlaying ? 'none' : 'auto';
		}
		if (mpBtnPause) {
			mpBtnPause.style.opacity = isPlaying ? '1' : '0.5';
			mpBtnPause.style.pointerEvents = isPlaying ? 'auto' : 'none';
		}
	}

	function toggleMusicPanel(show) {
		console.log('toggleMusicPanel called with show =', show);
		if (show) {
			console.log('Opening music panel, currentTrack:', currentTrack);

			musicPanel.classList.remove('hidden');
			musicPanel.classList.remove('hidden-init');

			if (window.currentAudioBubbleTrack) {
				const bubbleTrack = window.currentAudioBubbleTrack;
				// console.log('Found currentAudioBubbleTrack:', bubbleTrack.title);
				const trackIndex = tracks.findIndex(
					(t) => t.title === bubbleTrack.title && t.artist === bubbleTrack.artist,
				);
				if (trackIndex !== -1) {
					// console.log('Found audio bubble track in library at index:', trackIndex);
					selectTrack(trackIndex);
				}
			} else if (!currentTrack) {
				// console.log('No current track, selecting first track');
				selectTrack(0);
			} else {
				// console.log('Using existing currentTrack:', currentTrack.title);
			}
		} else {
			// console.log('Closing music panel');
			musicPanel.classList.add('hidden');

			musicPanel.addEventListener(
				'animationend',
				function pauseAfterAnimation() {
					if (musicPanel.classList.contains('hidden')) {
						audio.pause();
					}
					musicPanel.removeEventListener('animationend', pauseAfterAnimation);
				},
				{once: true},
			);
		}
	}

	// Control buttons
	if (mpBtnPlay) {
		mpBtnPlay.addEventListener('click', () => {
			if (audio.paused) {
				audio.play().catch(() => {});
				updatePlayPauseIcons(true);
			}
		});
	}

	if (mpBtnPause) {
		mpBtnPause.addEventListener('click', () => {
			audio.pause();
			if (window.effectSystem) {
				window.effectSystem.clearAllEffects();
			}
			updatePlayPauseIcons(false);
		});
	}

	if (mpBtnLink) {
		mpBtnLink.addEventListener('click', () => {
			if (currentTrack?.url) {
				window.open(currentTrack.url);
			}
		});
	}

	if (mpBtnClose) {
		mpBtnClose.addEventListener('click', () => {
			if (window.effectSystem) {
				window.effectSystem.clearAllEffects();
			}
			toggleMusicPanel(false);
		});
	}

	// Volume control
	if (mpVolume) {
		mpVolume.value = '0.8';
		audio.volume = 0.8;
		mpVolume.addEventListener('input', (e) => {
			const v = parseFloat(e.target.value);
			if (!Number.isNaN(v)) audio.volume = Math.min(1, Math.max(0, v));
		});
	}

	// Audio end event
	audio.addEventListener('ended', () => {
		const currentIndex = tracks.indexOf(currentTrack);
		if (currentIndex < tracks.length - 1) {
			selectTrack(currentIndex + 1);
		} else {
			updatePlayPauseIcons(false);
		}
	});

	// Audio play/pause events
	audio.addEventListener('play', () => {
		updatePlayPauseIcons(true);
	});

	audio.addEventListener('pause', () => {
		updatePlayPauseIcons(false);
	});

	// Queue button click - open music panel
	if (audioQueBtn) {
		audioQueBtn.addEventListener('click', () => {
			toggleMusicPanel(true);
		});
	}

	// Initialize
	console.log('Initializing music library...');
	await loadMusicLibrary();
	console.log('Tracks loaded:', tracks.length, 'tracks');
	if (tracks.length > 0) {
		populateTracklist();
		selectTrack(0);
		// console.log('Music library initialized, lightMode system active');
	} else {
		console.error('No tracks loaded from music library');
	}
});
