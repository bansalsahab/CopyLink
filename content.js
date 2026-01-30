// Content script - Auto-fill shortcuts in form fields
// Detects /command shortcuts and auto-fills them

let shortcuts = {};
let suggestionBox = null;
let currentInput = null;
let currentCommand = '';

// Load shortcuts from storage
function loadShortcuts() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('shortcuts', (result) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                resolve({});
                return;
            }
            shortcuts = (result && result.shortcuts) || {};
            resolve(shortcuts);
        });
    });
}

// Create suggestion box
function createSuggestionBox() {
    if (suggestionBox && suggestionBox.parentElement) {
        suggestionBox.remove();
    }
    
    suggestionBox = document.createElement('div');
    suggestionBox.id = 'link-shortcut-suggestion';
    suggestionBox.style.cssText = `
        position: fixed;
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 14px;
        font-family: 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        max-width: 400px;
        word-break: break-all;
        display: none;
        animation: slideIn 0.2s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        #link-shortcut-suggestion {
            color: #333;
        }
        
        #link-shortcut-suggestion .shortcut-hint {
            color: #667eea;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        #link-shortcut-suggestion .shortcut-value {
            color: #666;
            font-size: 13px;
            background: #f5f5f5;
            padding: 6px 10px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        #link-shortcut-suggestion .hint-text {
            color: #999;
            font-size: 12px;
        }
    `;
    
    if (!document.head.querySelector('style[data-shortcut-styles]')) {
        style.setAttribute('data-shortcut-styles', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(suggestionBox);
    return suggestionBox;
}

// Show suggestion
function showSuggestion(command, input) {
    if (!shortcuts[command]) return;
    
    const suggestion = suggestionBox || createSuggestionBox();
    const value = shortcuts[command];
    
    suggestion.innerHTML = `
        <div class="shortcut-hint">✓ Found: ${command}</div>
        <div class="shortcut-value">${value}</div>
        <div class="hint-text">Press <strong>Tab</strong> or <strong>Enter</strong> to insert</div>
    `;
    
    suggestion.style.display = 'block';
    
    // Position suggestion below the input
    const rect = input.getBoundingClientRect();
    suggestion.style.top = (rect.bottom + 5) + 'px';
    suggestion.style.left = rect.left + 'px';
    suggestion.style.width = Math.min(rect.width - 4, 400) + 'px';
    
    currentInput = input;
    currentCommand = command;
}

// Hide suggestion
function hideSuggestion() {
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
    currentInput = null;
    currentCommand = '';
}

// Insert shortcut value into input
function insertShortcut(input, command) {
    if (!shortcuts[command]) return;
    
    const value = shortcuts[command];
    const text = input.value;
    
    // Find the last occurrence of the command
    const lastIndex = text.lastIndexOf(command);
    if (lastIndex === -1) return;
    
    // Replace the command with the value
    const before = text.substring(0, lastIndex);
    const after = text.substring(lastIndex + command.length);
    
    input.value = before + value + after;
    
    // Move cursor to end
    input.selectionStart = input.selectionEnd = (before + value).length;
    
    // Trigger input event for form libraries
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    hideSuggestion();
    
    // Show confirmation
    showConfirmation(input, 'Link inserted!');
}

// Show confirmation message
function showConfirmation(input, message) {
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        background: #4caf50;
        color: white;
        padding: 10px 16px;
        border-radius: 4px;
        font-size: 13px;
        z-index: 999999;
        font-family: 'Segoe UI', Arial;
        animation: slideIn 0.2s ease-out;
    `;
    
    const rect = input.getBoundingClientRect();
    confirmation.style.top = (rect.top - 40) + 'px';
    confirmation.style.left = rect.left + 'px';
    confirmation.textContent = message;
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.remove();
    }, 2000);
}

// Monitor input and textarea fields
function monitorInput(input) {
    input.addEventListener('input', () => {
        const text = input.value;
        const words = text.split(/\s/);
        const lastWord = words[words.length - 1];
        
        // Check if last word is a shortcut command
        if (lastWord.startsWith('/') && lastWord.length > 1) {
            showSuggestion(lastWord, input);
        } else {
            hideSuggestion();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (!currentInput || currentInput !== input) return;
        
        // Tab or Enter to insert
        if ((e.key === 'Tab' || e.key === 'Enter') && currentCommand) {
            e.preventDefault();
            insertShortcut(input, currentCommand);
        }
        
        // Escape to dismiss
        if (e.key === 'Escape') {
            e.preventDefault();
            hideSuggestion();
        }
    });
    
    input.addEventListener('blur', () => {
        setTimeout(() => {
            hideSuggestion();
        }, 200);
    });
}

// Monitor contenteditable elements
function getLastWordFromContentEditable(el) {
    try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.anchorNode) {
            const node = sel.anchorNode;
            const portion = node.textContent.substring(0, sel.anchorOffset || 0);
            const words = portion.split(/\s/);
            return words[words.length - 1] || '';
        }
        // Fallback
        const text = el.innerText || el.textContent || '';
        const words = text.split(/\s/);
        return words[words.length - 1] || '';
    } catch (e) {
        return '';
    }
}

function insertContentEditableShortcut(el, command) {
    if (!shortcuts[command]) return;
    const value = shortcuts[command];
    try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            // fallback: append
            el.innerText = (el.innerText || '') + ' ' + value;
            return;
        }

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        // Replace last occurrence of command in the current text node
        const text = node.textContent;
        const lastIndex = text.lastIndexOf(command, offset);
        if (lastIndex === -1) {
            // fallback: insert at caret
            const textNode = document.createTextNode(value);
            range.deleteContents();
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const before = text.substring(0, lastIndex);
        const after = text.substring(lastIndex + command.length);
        const newText = before + value + after;
        node.textContent = newText;

        // Move caret after inserted value
        const newOffset = (before + value).length;
        const newRange = document.createRange();
        newRange.setStart(node, Math.min(newOffset, node.length));
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        el.dispatchEvent(new Event('input', { bubbles: true }));
        showConfirmation(el, 'Link inserted!');
        hideSuggestion();
    } catch (e) {
        console.error('insertContentEditableShortcut error', e);
    }
}

// Monitor contenteditable elements
function monitorContentEditable(el) {
    // avoid double binding
    if (el.hasAttribute('data-shortcut-monitored')) return;
    el.setAttribute('data-shortcut-monitored', 'true');

    el.addEventListener('input', () => {
        const lastWord = getLastWordFromContentEditable(el);
        if (lastWord && lastWord.startsWith('/') && lastWord.length > 1) {
            showSuggestion(lastWord, el);
        } else {
            hideSuggestion();
        }
    });

    el.addEventListener('keydown', (e) => {
        if (!currentInput || currentInput !== el) return;
        if ((e.key === 'Tab' || e.key === 'Enter') && currentCommand) {
            e.preventDefault();
            insertContentEditableShortcut(el, currentCommand);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            hideSuggestion();
        }
    });

    el.addEventListener('blur', () => {
        setTimeout(hideSuggestion, 200);
    });
}

// Find all inputs, textareas and contenteditable elements and monitor them
function monitorAllInputs() {
    const selector = 'input, textarea, [contenteditable="true"]';
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
        const type = input.getAttribute && input.getAttribute('type');
        // prefer monitoring common text-like inputs
        const isTextLike = !type || ['text', 'search', 'email', 'url', 'tel', 'password'].includes(type);
        if (input.isContentEditable) {
            monitorContentEditable(input);
        } else if (isTextLike) {
            if (!input.hasAttribute('data-shortcut-monitored')) {
                input.setAttribute('data-shortcut-monitored', 'true');
                monitorInput(input);
            }
        }
    });
}

// Monitor for dynamically added inputs
function observeDOMChanges() {
    const observer = new MutationObserver(() => {
        monitorAllInputs();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await loadShortcuts();
        monitorAllInputs();
        observeDOMChanges();
    });
} else {
    loadShortcuts().then(() => {
        monitorAllInputs();
        observeDOMChanges();
    });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.shortcuts) {
        shortcuts = changes.shortcuts.newValue || {};
        console.log('Shortcuts updated:', shortcuts);
    }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
        navigator.clipboard.writeText(request.text).then(() => {
            sendResponse({ success: true });
        }).catch(() => {
            sendResponse({ success: false });
        });
        return true;
    }
});
