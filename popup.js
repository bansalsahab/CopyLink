// Default shortcuts mapping
const DEFAULT_SHORTCUTS = {
    '/github': 'https://github.com',
    '/linkedin': 'https://linkedin.com',
    '/twitter': 'https://twitter.com',
    '/portfolio': 'https://example.com',
    '/email': 'developer@example.com',
    '/resume': 'https://example.com/resume.pdf'
};

// Load shortcuts from storage or use defaults
function loadShortcuts() {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get('shortcuts', (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                    resolve(DEFAULT_SHORTCUTS);
                    return;
                }
                resolve((result && result.shortcuts) || DEFAULT_SHORTCUTS);
            });
        } catch (error) {
            console.error('Failed to load shortcuts:', error);
            resolve(DEFAULT_SHORTCUTS);
        }
    });
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Display shortcuts in the popup
async function displayShortcuts() {
    try {
        const shortcuts = await loadShortcuts();
        const list = document.getElementById('shortcutsList');
        
        if (!list) {
            console.error('shortcutsList element not found');
            return;
        }
        
        list.innerHTML = '';

        Object.keys(shortcuts).forEach(command => {
            const li = document.createElement('li');
            li.textContent = command;
            li.addEventListener('click', () => {
                const input = document.getElementById('commandInput');
                if (input) {
                    input.value = command;
                    handleCommand(command, shortcuts);
                }
            });
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error displaying shortcuts:', error);
    }
}

// Handle command execution
async function handleCommand(command, shortcuts = null) {
    try {
        if (!shortcuts) {
            shortcuts = await loadShortcuts();
        }

        const trimmedCommand = command.trim();
        const resultSection = document.getElementById('resultSection');
        const resultText = document.getElementById('resultText');
        
        if (!trimmedCommand) {
            if (resultSection) resultSection.style.display = 'none';
            return;
        }

        if (shortcuts[trimmedCommand]) {
            const url = shortcuts[trimmedCommand];
            const copied = await copyToClipboard(url);
            
            if (copied) {
                if (resultText) resultText.textContent = `✓ Copied: ${url}`;
                if (resultSection) resultSection.style.display = 'block';
                
                // Clear after 3 seconds
                setTimeout(() => {
                    if (resultSection) resultSection.style.display = 'none';
                }, 3000);
            } else {
                if (resultText) resultText.textContent = `✗ Failed to copy. Please try again.`;
                if (resultSection) resultSection.style.display = 'block';
            }
        } else {
            if (resultText) resultText.textContent = `✗ Command not found: ${trimmedCommand}`;
            if (resultSection) resultSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error handling command:', error);
        const resultText = document.getElementById('resultText');
        if (resultText) resultText.textContent = '✗ An error occurred';
    }
}

// Event listeners
const copyBtn = document.getElementById('copyBtn');
const commandInput = document.getElementById('commandInput');
const copyResultBtn = document.getElementById('copyResultBtn');
const settingsBtn = document.getElementById('settingsBtn');

if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const command = commandInput ? commandInput.value : '';
        await handleCommand(command);
    });
}

if (commandInput) {
    commandInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const command = commandInput.value;
            await handleCommand(command);
        }
    });
}

if (copyResultBtn) {
    copyResultBtn.addEventListener('click', async () => {
        const resultText = document.getElementById('resultText');
        if (resultText) {
            const text = resultText.textContent.replace('✓ Copied: ', '');
            await copyToClipboard(text);
        }
    });
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        try {
            chrome.runtime.openOptionsPage();
        } catch (error) {
            console.error('Error opening options page:', error);
            // Fallback: open options.html directly
            chrome.tabs.create({ url: 'options.html' });
        }
    });
}

// Initialize popup
displayShortcuts();
