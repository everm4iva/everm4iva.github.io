document.addEventListener('DOMContentLoaded', () => {
	const musicItems = document.querySelectorAll('[id^="item"]');

	// variable to keep track of the currently active item
	let activeItem = null;

	musicItems.forEach((item) => {
		// cache the inner elements for this specific item
		const number = item.querySelector('.number');
		const urlEl = item.querySelector('.url');
		const audioEl = item.querySelector('.audio');
		const audioTag = audioEl ? audioEl.querySelector('audio') : null;

		// 1. prevent clicks on <a> tags inside .url from triggering the parent item's logic
		if (urlEl) {
			urlEl.addEventListener('click', function (e) {
				if (e.target.tagName === 'A') {
					e.stopPropagation();
				}
			});
		}

		// if there's no audio tag inside, skip audio setup for this item
		if (!audioTag) return;

		// 2. click listener for the item itself
		item.addEventListener('click', function () {
			// if clicking the item that is ALREADY active
			if (this === activeItem) {
				if (this.classList.contains('playing')) {
					// if it's playing, pause it and show the URL/links again
					audioTag.pause();
					if (audioEl) audioEl.style.display = 'none';
					if (number) number.style.display = 'flex';
					if (urlEl) urlEl.style.display = 'block';
				} else {
					// if it's paused, resume playing
					if (urlEl) urlEl.style.display = 'none';
					if (number) number.style.display = 'none';
					if (audioEl) audioEl.style.display = 'block';
					audioTag.play().catch((error) => console.log('Audio error:', error));
				}
				return;
			}

			// 3. if clicking a NEW item, first clean up the previously active item
			if (activeItem) {
				const prevAudioTag = activeItem.querySelector('.audio audio');
				const prevAudioEl = activeItem.querySelector('.audio');
				const prevNumber = activeItem.querySelector('.number');
				const prevUrlEl = activeItem.querySelector('.url');

				if (prevAudioTag) prevAudioTag.pause(); // this triggers the 'pause' event listener which removes .playing - has a custom pause icon on hover css side
				if (prevAudioEl) prevAudioEl.style.display = 'none';
				if (prevNumber) prevNumber.style.display = 'flex';
				if (prevUrlEl) prevUrlEl.style.display = 'block';
			}

			// 4. setup and play the newly clicked item
			if (number) number.style.display = 'none';
			if (urlEl) urlEl.style.display = 'none';
			if (audioEl) audioEl.style.display = 'block';

			audioTag.play().catch((error) => console.log('Autoplay blocked or audio error:', error));

			// update the activeItem reference to the current one
			activeItem = this;
		});

		// 5. listeners for the audio tag to handle the "".playing" class
		audioTag.addEventListener('play', () => {
			item.classList.add('playing');
		});

		audioTag.addEventListener('pause', () => {
			item.classList.remove('playing');
		});

		audioTag.addEventListener('ended', () => {
			item.classList.remove('playing');
			// optional: when the song finishes naturally, reset it to look like the default state
			if (item === activeItem) {
				if (audioEl) audioEl.style.display = 'none';
				if (number) number.style.display = 'flex';
				if (urlEl) urlEl.style.display = 'block';
				activeItem = null;
			}
		});
	});
});
