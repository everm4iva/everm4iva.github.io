/* === Markdown Editor for OceanBoard === */

import { preprocessMediaMentions } from './mediarenderer.js';

export function createMarkdownEditor(container, initialText = '') {
    container.innerHTML = `
        <div class="ob-md-editor">
            <div>
                <div class="ob-md-input-wrapper">
                    <div class="ob-md-line-numbers" aria-hidden="true"></div>
                    <div class="ob-md-highlights" aria-hidden="true"></div>
                    <textarea class="ob-md-input">${initialText}</textarea>
                </div>
                <div class="ob-md-preview"></div>
            </div>
            <div class="ob-md-toolbar">
                <button class="ob-md-btn" data-action="bold" title="Bold">
                    <span class="material-icons-round" translate="no">format_bold</span>
                </button>
                <button class="ob-md-btn" data-action="italic" title="Italic">
                    <span class="material-icons-round" translate="no">format_italic</span>
                </button>
                <button class="ob-md-btn" data-action="strikethrough" title="Strikethrough">
                    <span class="material-icons-round" translate="no">format_strikethrough</span>
                </button>
                <div class="ob-md-divider"></div>
                <button class="ob-md-btn" data-action="h1" title="Heading 1">
                    <span class="material-icons-round" translate="no">title</span>
                </button>
                <button class="ob-md-btn" data-action="h2" title="Heading 2">
                    <span class="material-icons-round" translate="no">subtitles</span>
                </button>
                <button class="ob-md-btn" data-action="h3" title="Heading 3">
                    <span class="material-icons-round" translate="no">text_fields</span>
                </button>
                <div class="ob-md-divider"></div>
                <button class="ob-md-btn" data-action="list" title="Bullet List">
                    <span class="material-icons-round" translate="no">format_list_bulleted</span>
                </button>
                <button class="ob-md-btn" data-action="number" title="Numbered List">
                    <span class="material-icons-round" translate="no">format_list_numbered</span>
                </button>
                <button class="ob-md-btn" data-action="quote" title="Quote">
                    <span class="material-icons-round" translate="no">format_quote</span>
                </button>
                <div class="ob-md-divider"></div>
                <button class="ob-md-btn" data-action="code" title="Inline Code">
                    <span class="material-icons-round" translate="no">code</span>
                </button>
                <button class="ob-md-btn" data-action="link" title="Link">
                    <span class="material-icons-round" translate="no">link</span>
                </button>
                <button class="ob-md-btn" data-action="image" title="Image">
                    <span class="material-icons-round" translate="no">image</span>
                </button>
                <div class="ob-md-divider"></div>
                <button class="ob-md-btn ob-md-presentation-btn" data-action="presentation" title="Presentation Mode">
                    <span class="material-icons-round" translate="no">visibility</span>
                </button>
            </div>
        </div>
    `;
    
    const textarea = container.querySelector('.ob-md-input');
    const preview = container.querySelector('.ob-md-preview');
    const toolbar = container.querySelector('.ob-md-toolbar');
    const lineNumbers = container.querySelector('.ob-md-line-numbers');
    const highlights = container.querySelector('.ob-md-highlights');
    
    // Apply saved settings to new editor
    applyEditorSettings(textarea, preview);
    
    // Update syntax highlighting for media mentions
    function updateHighlights() {
        if (!highlights) return;
        
        const text = textarea.value;
        // Replace $mentions with highlighted spans
        const highlightedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\$([a-zA-Z0-9-_.]+)/g, '<mark class="ob-media-mention">$$$1</mark>');
        
        highlights.innerHTML = highlightedText;
        highlights.scrollTop = textarea.scrollTop;
        highlights.scrollLeft = textarea.scrollLeft;
    }
    
    // Update line numbers
    function updateLineNumbers() {
        const lines = textarea.value.split('\n').length;
        const lineNumbersEnabled = localStorage.getItem('ob-setting-linenumbers') === 'true';
        
        if (lineNumbersEnabled && lineNumbers) {
            let numbersHtml = '';
            for (let i = 1; i <= lines; i++) {
                numbersHtml += `<div>${i}</div>`;
            }
            lineNumbers.innerHTML = numbersHtml;
            lineNumbers.style.display = 'block';
        } else if (lineNumbers) {
            lineNumbers.style.display = 'none';
        }
    }
    
    function updatePreview() {
        if (window.marked) {
            // Preprocess to convert $mentions to media links
            const processedMarkdown = preprocessMediaMentions(textarea.value);
            preview.innerHTML = window.marked.parse(processedMarkdown);
        } else {
            preview.textContent = textarea.value;
        }
        updateLineNumbers();
        updateHighlights();
    }
    
    function insertMarkdown(before, after = '', placeholder = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const text = selectedText || placeholder;
        const newText = before + text + after;
        
        textarea.setRangeText(newText, start, end, 'end');
        textarea.focus();
        
        if (!selectedText && placeholder) {
            textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
        }
        
        updatePreview();
        textarea.dispatchEvent(new Event('input'));
    }
    
    function handleToolbarAction(action) {
        switch(action) {
            case 'bold':
                insertMarkdown('**', '**', 'bold text');
                break;
            case 'italic':
                insertMarkdown('*', '*', 'italic text');
                break;
            case 'strikethrough':
                insertMarkdown('~~', '~~', 'strikethrough');
                break;
            case 'h1':
                insertMarkdown('# ', '', 'Heading 1');
                break;
            case 'h2':
                insertMarkdown('## ', '', 'Heading 2');
                break;
            case 'h3':
                insertMarkdown('### ', '', 'Heading 3');
                break;
            case 'list':
                insertMarkdown('- ', '', 'List item');
                break;
            case 'number':
                insertMarkdown('1. ', '', 'Numbered item');
                break;
            case 'quote':
                insertMarkdown('> ', '', 'Quote');
                break;
            case 'code':
                insertMarkdown('`', '`', 'code');
                break;
            case 'link':
                insertMarkdown('[', '](url)', 'link text');
                break;
            case 'image':
                insertMarkdown('![', '](image-url)', 'alt text');
                break;
            case 'presentation':
                openPresentationMode();
                break;
        }
    }
    
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.ob-md-btn');
        if (btn) {
            const action = btn.dataset.action;
            handleToolbarAction(action);
        }
    });
    
    textarea.addEventListener('input', updatePreview);
    textarea.addEventListener('scroll', updateHighlights);
    updatePreview();
    
    // Right-click on media mentions (images only) for sizing options
    textarea.addEventListener('contextmenu', (e) => {
        const pos = textarea.selectionStart;
        const text = textarea.value;
        
        // Find if cursor is within a $mention
        let mentionStart = -1;
        let mentionEnd = -1;
        let mention = null;
        
        // Search backwards for $
        for (let i = pos; i >= 0; i--) {
            if (text[i] === '$') {
                mentionStart = i;
                break;
            }
            // If we hit whitespace or newline before $, no mention
            if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
                break;
            }
        }
        
        // Search forwards for end of mention
        if (mentionStart !== -1) {
            for (let i = mentionStart + 1; i < text.length; i++) {
                if (!/[a-zA-Z0-9-_.]/.test(text[i])) {
                    mentionEnd = i;
                    break;
                }
            }
            if (mentionEnd === -1) mentionEnd = text.length;
            
            mention = text.substring(mentionStart, mentionEnd);
        }
        
        // If we found a mention, check if it's an image
        if (mention && window.mediasystem) {
            const mediaId = window.mediasystem.getMediaIdFromMention(mention);
            if (mediaId) {
                const media = window.mediasystem.getMedia(mediaId);
                if (media && media.type === 'image') {
                    e.preventDefault();
                    showMediaMentionContextMenu(e, mention, mediaId, mentionStart, mentionEnd);
                }
            }
        }
    });
    
    // Handle backspace on media mentions - delete entire mention
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            const pos = textarea.selectionStart;
            const text = textarea.value;
            
            // Check if we're at the end of a media mention
            const beforeCursor = text.substring(0, pos);
            const match = beforeCursor.match(/\$([a-zA-Z0-9-_.]+)$/);
            
            if (match) {
                // Delete entire mention
                e.preventDefault();
                const mentionStart = pos - match[0].length;
                textarea.value = text.substring(0, mentionStart) + text.substring(pos);
                textarea.selectionStart = textarea.selectionEnd = mentionStart;
                textarea.dispatchEvent(new Event('input'));
            }
        }
    });
}

// Show context menu for media mention (images only)
function showMediaMentionContextMenu(event, mention, mediaId, mentionStart, mentionEnd) {
    // Remove existing context menu
    const existing = document.querySelector('.ob-mention-context-menu');
    if (existing) existing.remove();
    
    const textarea = document.querySelector('.ob-md-input');
    if (!textarea) return;
    
    const menu = document.createElement('div');
    menu.className = 'ob-context-menu ob-mention-context-menu';
    
    const options = [
        { 
            icon: 'photo_size_select_large', 
            label: 'Set Size (Pixels)', 
            action: () => promptImageSize(textarea, mention, mentionStart, mentionEnd, 'px') 
        },
        { 
            icon: 'aspect_ratio', 
            label: 'Set Size (Percentage)', 
            action: () => promptImageSize(textarea, mention, mentionStart, mentionEnd, '%') 
        },
        { 
            icon: 'restore', 
            label: 'Restore Original Size', 
            action: () => removeImageSize(textarea, mention, mentionStart, mentionEnd) 
        }
    ];
    
    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'ob-context-menu-item';
        item.innerHTML = `<span class="material-icons-round" translate="no">${opt.icon}</span>${opt.label}`;
        item.onclick = () => {
            opt.action();
            menu.remove();
        };
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);

    // Position menu with viewport bounds checking
    if (window.mediasystem && window.mediasystem.positionContextMenu) {
        // Use internal function - we need to expose it
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let finalX = event.clientX;
        let finalY = event.clientY;
        
        if (menuRect.right > viewportWidth) {
            finalX = event.clientX - menuRect.width;
            if (finalX < 0) finalX = 10;
        }
        
        if (menuRect.bottom > viewportHeight) {
            finalY = event.clientY - menuRect.height;
            if (finalY < 0) finalY = 10;
        }
        
        menu.style.left = finalX + 'px';
        menu.style.top = finalY + 'px';
    } else {
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }

    // Prevent menu clicks from closing the menu
    menu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close on click outside
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 10);
}

// Prompt for image size
function promptImageSize(textarea, mention, mentionStart, mentionEnd, unit) {
    const size = prompt(`Enter image ${unit === 'px' ? 'width in pixels' : 'width as percentage (0-100)'}:`);
    if (!size) return;
    
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum) || sizeNum <= 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    if (unit === '%' && (sizeNum > 100 || sizeNum < 1)) {
        alert('Percentage must be between 1 and 100');
        return;
    }
    
    // Replace mention with sized version: $filename{width:500px} or $filename{width:50%}
    const text = textarea.value;
    const sizedMention = `${mention}{width:${sizeNum}${unit}}`;
    
    textarea.value = text.substring(0, mentionStart) + sizedMention + text.substring(mentionEnd);
    textarea.selectionStart = textarea.selectionEnd = mentionStart + sizedMention.length;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
}

// Remove image sizing
function removeImageSize(textarea, mention, mentionStart, mentionEnd) {
    const text = textarea.value;
    
    // Check if there's already sizing info
    const afterMention = text.substring(mentionEnd);
    const sizeMatch = afterMention.match(/^\{[^}]+\}/);
    
    if (sizeMatch) {
        // Remove the sizing info
        textarea.value = text.substring(0, mentionEnd) + text.substring(mentionEnd + sizeMatch[0].length);
    }
    
    textarea.selectionStart = textarea.selectionEnd = mentionEnd;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
}

function openPresentationMode() {
    // Get current open tab's file name and series
    const activeTab = document.querySelector('.ob-tab.active');
    if (!activeTab) {
        console.log('[Presentation] No active tab found');
        return;
    }
    
    const fileName = activeTab.dataset.id; // File ID is stored in data-id
    const seriesId = localStorage.getItem('ob-active-series');
    
    if (!fileName || !seriesId) {
        console.log('[Presentation] Missing file or series information', { fileName, seriesId });
        return;
    }
    
    // Open presentation mode in new window
    const width = 1200;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    const url = `./iframes/presentation.html?file=${encodeURIComponent(fileName)}&series=${encodeURIComponent(seriesId)}`;
    
    window.open(
        url,
        'OceanBoard Presentation',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    console.log('[Presentation] Opened presentation mode for:', fileName);
}

function applyEditorSettings(textarea, preview) {
    const fontSize = localStorage.getItem('ob-setting-fontsize') || '14';
    const lineHeight = localStorage.getItem('ob-setting-lineheight') || '1.6';
    const wordWrap = localStorage.getItem('ob-setting-wordwrap') !== 'false';
    
    textarea.style.fontSize = fontSize + 'px';
    preview.style.fontSize = fontSize + 'px';
    textarea.style.lineHeight = lineHeight;
    preview.style.lineHeight = lineHeight;
    
    if (wordWrap) {
        textarea.style.whiteSpace = 'pre-wrap';
        textarea.style.overflowX = 'hidden';
    } else {
        textarea.style.whiteSpace = 'pre';
        textarea.style.overflowX = 'auto';
    }
}
