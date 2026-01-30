const DEFAULT_SHORTCUTS = {
    '/github': 'https://github.com',
    '/linkedin': 'https://linkedin.com',
    '/twitter': 'https://twitter.com',
    '/portfolio': 'https://example.com',
    '/email': 'developer@example.com',
    '/resume': 'https://example.com/resume.pdf'
};

// Load and display shortcuts
function loadShortcuts() {
    try {
        chrome.storage.sync.get('shortcuts', (result) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                return;
            }
            
            const shortcuts = (result && result.shortcuts) || DEFAULT_SHORTCUTS;
            const container = document.getElementById('shortcutsContainer');
            
            if (!container) {
                console.error('shortcutsContainer element not found');
                return;
            }
            
            container.innerHTML = '';

            Object.entries(shortcuts).forEach(([command, url]) => {
                const row = document.createElement('div');
                row.className = 'shortcut-row';
                row.innerHTML = `
                    <div class="shortcut-command">${escapeHtml(command)}</div>
                    <div class="shortcut-url">${escapeHtml(url)}</div>
                    <button class="btn-delete" data-command="${escapeHtml(command)}">Delete</button>
                `;

                const deleteBtn = row.querySelector('.btn-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        delete shortcuts[command];
                        chrome.storage.sync.set({ shortcuts }, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Error deleting shortcut:', chrome.runtime.lastError);
                            } else {
                                loadShortcuts();
                            }
                        });
                    });
                }

                container.appendChild(row);
            });
        });
    } catch (error) {
        console.error('Error loading shortcuts:', error);
    }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Add new shortcut
const addBtn = document.getElementById('addBtn');
if (addBtn) {
    addBtn.addEventListener('click', () => {
        const commandInput = document.getElementById('newCommand');
        const urlInput = document.getElementById('newURL');
        
        if (!commandInput || !urlInput) {
            showStatus('Form elements not found', 'error');
            return;
        }
        
        const command = commandInput.value.trim();
        const url = urlInput.value.trim();

        if (!command || !url) {
            showStatus('Please fill in both fields', 'error');
            return;
        }

        if (!command.startsWith('/')) {
            showStatus('Command must start with /', 'error');
            return;
        }

        try {
            chrome.storage.sync.get('shortcuts', (result) => {
                if (chrome.runtime.lastError) {
                    showStatus('Storage error: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }
                
                const shortcuts = (result && result.shortcuts) || DEFAULT_SHORTCUTS;
                shortcuts[command] = url;
                chrome.storage.sync.set({ shortcuts }, () => {
                    if (chrome.runtime.lastError) {
                        showStatus('Error saving shortcut', 'error');
                    } else {
                        commandInput.value = '';
                        urlInput.value = '';
                        loadShortcuts();
                        showStatus('✓ Shortcut added successfully!', 'success');
                    }
                });
            });
        } catch (error) {
            showStatus('Error adding shortcut: ' + error.message, 'error');
        }
    });
}

// Reset to defaults
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all shortcuts to defaults?')) {
            try {
                chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS }, () => {
                    if (chrome.runtime.lastError) {
                        showStatus('Error resetting shortcuts', 'error');
                    } else {
                        loadShortcuts();
                        showStatus('✓ Reset to default shortcuts', 'success');
                    }
                });
            } catch (error) {
                showStatus('Error resetting: ' + error.message, 'error');
            }
        }
    });
}

// Save changes (optional, for future enhancements)
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        showStatus('✓ All changes are auto-saved!', 'success');
    });
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    setTimeout(() => {
        statusEl.className = 'status-message';
    }, 3000);
}

// Initialize
loadShortcuts();
