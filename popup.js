document.addEventListener('DOMContentLoaded', () => {
    render();
    const summarizeBtn = document.getElementById('summarize');
    summarizeBtn.addEventListener('click', () => {
        alert('Summarize will be added later.');
    });
});

function render(){
    chrome.storage.local.get(['highlights'], (result) => {
        const list = document.getElementById('list');
        const empty = document.getElementById('empty');
        list.innerHTML = '';
        const items = (result.highlights || []).slice().sort((a,b)=> b.createdAt - a.createdAt);
        if(items.length === 0){
            empty.style.display = 'block';
            document.getElementById('summarize').disabled = true;
            return;
        }
        empty.style.display = 'none';
        document.getElementById('summarize').disabled = false;
        items.forEach(hl => {
            const row = document.createElement('div');
            row.className = 'row';
            const favicon = document.createElement('img');
            favicon.className = 'favicon';
            favicon.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(hl.url)}&size=16`;
            const meta = document.createElement('div');
            meta.className = 'meta';
            const title = document.createElement('div');
            title.className = 'title';
            const domain = new URL(hl.url).hostname;
            title.textContent = hl.pageTitle;
            const domainEl = document.createElement('span');
            domainEl.className = 'domain';
            domainEl.textContent = `(${domain})`;
            const text = document.createElement('div');
            text.className = 'text';
            text.textContent = hl.text;
            const actions = document.createElement('div');
            actions.className = 'actions';
            const del = document.createElement('button');
            del.className = 'btn';
            del.textContent = 'Delete';
            del.addEventListener('click', () => onDelete(hl.id));
            meta.addEventListener('click', () => chrome.tabs.create({ url: hl.url }));
            meta.appendChild(title);
            meta.appendChild(domainEl);
            meta.appendChild(text);
            actions.appendChild(del);
            row.appendChild(favicon);
            row.appendChild(meta);
            row.appendChild(actions);
            list.appendChild(row);
        });
    });
}

function onDelete(id){
    chrome.storage.local.get(['highlights'], (result) => {
        const arr = result.highlights || [];
        const idx = arr.findIndex(x => x.id === id);
        if(idx === -1) return;
        const removed = arr.splice(idx,1)[0];
        chrome.storage.local.set({ highlights: arr }, () => {
            render();
            showSnack('Deleted.', () => {
                chrome.storage.local.get(['highlights'], (r2) => {
                    const restored = (r2.highlights || []);
                    restored.push(removed);
                    restored.sort((a,b)=> a.createdAt - b.createdAt);
                    chrome.storage.local.set({ highlights: restored }, () => render());
                });
            });
        });
    });
}

function showSnack(msg, onUndo){
    const bar = document.getElementById('snackbar');
    const text = document.getElementById('snack-text');
    const undo = document.getElementById('snack-undo');
    text.textContent = msg;
    bar.style.display = 'flex';
    const t = setTimeout(() => { bar.style.display = 'none'; }, 4000);
    const handler = () => {
        clearTimeout(t);
        bar.style.display = 'none';
        undo.removeEventListener('click', handler);
        if(onUndo) onUndo();
    };
    undo.addEventListener('click', handler);
}


