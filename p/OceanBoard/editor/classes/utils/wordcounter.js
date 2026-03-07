/**
 * OceanBoard Word Count & Statistics
 * Live word counting and writing stats - fun
 */

class WordCounter {
	constructor() {
		this.element = null;
		this.isVisible = true;
		this.currentContent = "";
		this.stats = {
			words: 0,
			characters: 0,
			charactersNoSpaces: 0,
			paragraphs: 0,
			readingTime: 0,
		};
		this.init();
	}

	init() {
		this.createElement();
		this.attachToEditor();
	}

	createElement() {
		this.element = document.createElement("div");
		this.element.className = "ob-word-count";
		this.element.innerHTML = this.formatStats();
		document.body.appendChild(this.element);
	}

	attachToEditor() {
		// Watch for editor changes
		const observer = new MutationObserver(() => {
			this.updateFromActiveEditor();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Update when content changes
		document.addEventListener("input", (e) => {
			if (e.target.classList.contains("ob-md-input")) {
				this.updateStats(e.target.value);
			}
		});

		// Hide/show based on editor presence
		this.checkEditorVisibility();
	}

	updateFromActiveEditor() {
		const activeEditor = document.querySelector(".ob-md-input");
		if (activeEditor) {
			this.updateStats(activeEditor.value || "");
			this.show();
		} else {
			this.hide();
		}
	}

	updateStats(content) {
		if (content === this.currentContent) return;

		this.currentContent = content;
		this.stats = this.calculateStats(content);
		this.render();
	}

	calculateStats(content) {
		const text = content.trim();

		// Word count
		const words =
			text === ""
				? 0
				: text
						.replace(/\s+/g, " ") // Normalize whitespace
						.split(" ")
						.filter((word) => word.length > 0).length;

		// Character counts
		const characters = text.length;
		const charactersNoSpaces = text.replace(/\s/g, "").length;

		// Paragraph count
		const paragraphs =
			text === ""
				? 0
				: text.split(/\n\s*\n/).filter((para) => para.trim().length > 0)
						.length;

		// Reading time (average 200 words per minute)
		const readingTime = Math.ceil(words / 200);

		return {
			words,
			characters,
			charactersNoSpaces,
			paragraphs,
			readingTime,
		};
	}

	formatStats() {
		const { words, characters, paragraphs, readingTime } = this.stats;

		let display = `${words} words`;

		if (characters > 0) {
			display += ` • ${characters} chars`;
		}

		if (paragraphs > 1) {
			display += ` • ${paragraphs} ¶`;
		}

		if (readingTime > 0) {
			display += ` • ${readingTime}min read`;
		}

		return display;
	}

	render() {
		if (this.element) {
			this.element.innerHTML = this.formatStats();
		}
	}

	show() {
		if (this.element && !this.isVisible) {
			this.element.classList.remove("hidden");
			this.isVisible = true;
		}
	}

	hide() {
		if (this.element && this.isVisible) {
			this.element.classList.add("hidden");
			this.isVisible = false;
		}
	}

	toggle() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	checkEditorVisibility() {
		// Check periodically if editor is visible
		setInterval(() => {
			const activeEditor = document.querySelector(".ob-md-input");
			if (activeEditor && !this.isVisible) {
				this.updateFromActiveEditor();
			} else if (!activeEditor && this.isVisible) {
				this.hide();
			}
		}, 1000);
	}

	// Get detailed statistics
	getDetailedStats() {
		const {
			words,
			characters,
			charactersNoSpaces,
			paragraphs,
			readingTime,
		} = this.stats;

		return {
			...this.stats,
			sentences: this.countSentences(this.currentContent),
			averageWordsPerSentence: this.getAverageWordsPerSentence(),
			averageWordsPerParagraph:
				paragraphs > 0 ? Math.round(words / paragraphs) : 0,
			longestWord: this.getLongestWord(),
			mostCommonWords: this.getMostCommonWords(),
		};
	}

	countSentences(text) {
		if (!text.trim()) return 0;
		return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
	}

	getAverageWordsPerSentence() {
		const sentences = this.countSentences(this.currentContent);
		return sentences > 0 ? Math.round(this.stats.words / sentences) : 0;
	}

	getLongestWord() {
		if (!this.currentContent.trim()) return "";
		const words = this.currentContent
			.replace(/[^\w\s]/g, "")
			.split(/\s+/)
			.filter((word) => word.length > 0);

		return words.reduce(
			(longest, current) =>
				current.length > longest.length ? current : longest,
			""
		);
	}

	getMostCommonWords(limit = 5) {
		if (!this.currentContent.trim()) return [];

		const words = this.currentContent
			.toLowerCase()
			.replace(/[^\w\s]/g, "")
			.split(/\s+/)
			.filter((word) => word.length > 2); // Ignore short words

		const frequency = {};
		words.forEach((word) => {
			frequency[word] = (frequency[word] || 0) + 1;
		});

		return Object.entries(frequency)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([word, count]) => ({ word, count }));
	}

	// Export statistics
	exportStats() {
		return {
			timestamp: new Date().toISOString(),
			content: {
				length: this.currentContent.length,
				preview: this.currentContent.substring(0, 100) + "...",
			},
			statistics: this.getDetailedStats(),
		};
	}

	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.remove();
		}
	}
}

const wordCounter = new WordCounter();
export { WordCounter, wordCounter };
