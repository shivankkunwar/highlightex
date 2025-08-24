function debounce(func, delay){
    let timeout;
    return function (){
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    }
}

document.addEventListener("selectionchange", debounce(showChip, 75));

let ignoreNextOutsideClick = false;
let interactingWithChip = false;

function showChip(){
    const selection = document.getSelection();
    if(!selection.rangeCount || selection.toString().trim().length < 1){
        const existing = document.getElementById('highlight-saver-chip');
        if (existing && interactingWithChip) {
            return;
        }
        removeChip();
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    removeChip();
    const chip = document.createElement('div');
    chip.id = 'highlight-saver-chip';
    chip.style.position = 'absolute';
    chip.style.background = 'white';
    chip.style.border = '1px solid #e5e7eb';
    chip.style.padding = '8px 10px';
    chip.style.borderRadius = '8px';
    chip.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
    chip.style.zIndex = '2147483647';
    chip.style.display = 'flex';
    chip.style.gap = '8px';
    chip.style.alignItems = 'center';
    chip.style.backgroundClip = 'padding-box';
    chip.innerHTML = `
        <button id="save-highlight" style="background:#111827;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px">Save highlight</button>
        <button id="dismiss-chip" style="background:transparent;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;cursor:pointer;font-size:12px;color:#111827">×</button>
    `;
    document.body.appendChild(chip);
    chip.addEventListener('pointerdown', () => {
        interactingWithChip = true;
        setTimeout(() => { interactingWithChip = false; }, 250);
    });

    const chipRect = chip.getBoundingClientRect();
    let left = rect.left + window.scrollX + (rect.width / 2) - (chipRect.width / 2);
    let top = rect.top + window.scrollY - chipRect.height - 12;
    if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 12;
    }
    if (left < window.scrollX) {
        left = window.scrollX + 12;
    }
    const maxLeft = window.scrollX + document.documentElement.clientWidth - chipRect.width - 12;
    if (left > maxLeft) {
        left = maxLeft;
    }
    chip.style.left = left + 'px';
    chip.style.top = top + 'px';

    document.getElementById('save-highlight').addEventListener('click', () => {
        const text = selection.toString().trim();
        const url = window.location.href;
        const pageTitle = document.title;
        const createdAt = Date.now();
        const id = createdAt + '-' + Math.random().toString(36).slice(2);
        const highlight = { id, text, url, pageTitle, createdAt };
        chrome.storage.local.get(['highlights'], (result) => {
            const highlights = result.highlights || [];
            highlights.push(highlight);
            chrome.storage.local.set({ highlights }, () => {
                showSnackbar('Saved highlight.', () => {
                    chrome.storage.local.get(['highlights'], (r2) => {
                        const arr = (r2.highlights || []).filter(h => h.id !== id);
                        chrome.storage.local.set({ highlights: arr });
                    });
                });
                removeChip();
            });
        });
    });

    document.getElementById('dismiss-chip').addEventListener('click', removeChip);
    ignoreNextOutsideClick = true;
    document.addEventListener('click', outsideClickListener);
    document.addEventListener('keydown', escListener);
}

function removeChip() {
    const chip = document.getElementById('highlight-saver-chip');
    if (chip) chip.remove();
    document.removeEventListener('click', outsideClickListener);
    document.removeEventListener('keydown', escListener);
}

function outsideClickListener(event) {
    const chip = document.getElementById('highlight-saver-chip');
    if (ignoreNextOutsideClick) { ignoreNextOutsideClick = false; return; }
    if (chip && !chip.contains(event.target)) removeChip();
}

function escListener(event) {
    if (event.key === 'Escape') removeChip();
}

function showSnackbar(message, onUndo) {
    const existing = document.getElementById('highlight-saver-snackbar');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'highlight-saver-snackbar';
    bar.style.position = 'fixed';
    bar.style.left = '50%';
    bar.style.bottom = '24px';
    bar.style.transform = 'translateX(-50%)';
    bar.style.background = '#111827';
    bar.style.color = '#fff';
    bar.style.padding = '10px 12px';
    bar.style.borderRadius = '8px';
    bar.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
    bar.style.zIndex = '2147483647';
    bar.style.display = 'flex';
    bar.style.alignItems = 'center';
    bar.style.gap = '12px';
    const text = document.createElement('span');
    text.textContent = message;
    const btn = document.createElement('button');
    btn.textContent = 'Undo';
    btn.style.background = '#ffffff';
    btn.style.color = '#111827';
    btn.style.border = 'none';
    btn.style.padding = '6px 10px';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    bar.appendChild(text);
    bar.appendChild(btn);
    document.body.appendChild(bar);
    const t = setTimeout(() => bar.remove(), 4000);
    btn.addEventListener('click', () => {
        clearTimeout(t);
        bar.remove();
        if (onUndo) onUndo();
    });
}

