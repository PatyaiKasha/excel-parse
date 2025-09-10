// Import necessary libraries
const interact = require('interactjs');
const LeaderLine = require('leader-line-new');

// --- Global State ---
const lines = [];
let selectedElement = null;

// --- UI Helper Functions ---
function showStatus(message, type = 'info', duration = 4000) {
    const statusBar = document.getElementById('status-bar');
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusBar.className = `status-${type}`;
    if (type !== 'info') {
        setTimeout(() => {
            statusMessage.textContent = 'Ready';
            statusBar.className = '';
        }, duration);
    }
}

function createFieldElement(fieldName, nodeText) {
    const field = document.createElement('div');
    field.className = 'field';
    field.id = `field-${nodeText.replace(/\s+/g, '-')}-${fieldName.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    field.setAttribute('data-field-name', fieldName);
    field.innerHTML = `<span>${fieldName}</span><span class="handle"></span>`;
    return field;
}

function renderPreview(sourceField, destField, previewData) {
    const previewContent = document.getElementById('preview-content');
    previewContent.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headerRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = `Source: ${sourceField}`;
    const th2 = document.createElement('th');
    th2.textContent = `Destination: ${destField}`;
    headerRow.appendChild(th1);
    headerRow.appendChild(th2);
    thead.appendChild(headerRow);
    previewData.forEach(item => {
        const row = document.createElement('tr');
        const cell1 = document.createElement('td');
        cell1.textContent = item;
        const cell2 = document.createElement('td');
        cell2.textContent = item;
        row.appendChild(cell1);
        row.appendChild(cell2);
        tbody.appendChild(row);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    previewContent.appendChild(table);
}

// --- Node and Line Drawing Functions ---
function createNode(text, type, path, fields, x, y) {
    const node = document.createElement('div');
    node.className = 'canvas-node collapsed';
    node.setAttribute('data-path', path || '');
    node.setAttribute('data-type', type);
    node.style.left = x + 'px';
    node.style.top = y + 'px';

    const header = document.createElement('div');
    header.className = 'node-header';
    header.textContent = text;
    node.appendChild(header);

    const body = document.createElement('div');
    body.className = 'node-body';

    if (type === 'source') {
        if (fields && fields.length > 0) {
            fields.forEach(fieldName => body.appendChild(createFieldElement(fieldName, text)));
        }
    } else {
        const addFieldBtn = document.createElement('button');
        addFieldBtn.textContent = 'Add Field';
        addFieldBtn.className = 'btn btn-small';
        addFieldBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fieldName = prompt('Enter the new field name:');
            if (fieldName && fieldName.trim() !== '') {
                const newField = createFieldElement(fieldName.trim(), text);
                body.insertBefore(newField, addFieldBtn);
            }
        });
        body.appendChild(addFieldBtn);
    }
    node.appendChild(body);

    header.addEventListener('click', () => {
        node.classList.toggle('collapsed');
        setTimeout(() => lines.forEach(l => l.line.position()), 150);
    });

    return node;
}

// --- Interact.js Setups ---
interact('.dropzone').dropzone({
    accept: '.draggable-item',
    ondrop: function (event) {
        const draggableElement = event.relatedTarget;
        const dropzoneElement = event.target;
        const dropzoneRect = dropzoneElement.getBoundingClientRect();
        const dropX = event.client.x - dropzoneRect.left;
        const dropY = event.client.y - dropzoneRect.top;
        const type = draggableElement.getAttribute('data-type');
        const path = draggableElement.getAttribute('data-path');
        const fields = JSON.parse(draggableElement.getAttribute('data-fields') || '[]');
        const newNode = createNode(draggableElement.textContent, type, path, fields, dropX, dropY);
        dropzoneElement.querySelector('#canvas-main').appendChild(newNode);
        draggableElement.remove();
    }
});

interact('.canvas-node').draggable({
    allowFrom: '.node-header',
    listeners: {
        move(event) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            lines.forEach(lineInfo => {
                if (lineInfo.start.closest('.canvas-node') === target || lineInfo.end.closest('.canvas-node') === target) {
                    lineInfo.line.position();
                }
            });
        }
    }
});

let currentLine = null;
interact('.handle').draggable({
    listeners: {
        start(event) {
            event.interaction.stop();
            const handle = event.target;
            currentLine = new LeaderLine(handle, LeaderLine.pointAnchor(document.body, { x: event.pageX, y: event.pageY }), { color: 'rgba(255, 0, 0, 0.7)', size: 4, path: 'fluid', dash: { animation: true } });
        },
        move(event) { if (currentLine) { currentLine.end.x = event.pageX; currentLine.end.y = event.pageY; } },
        async end(event) {
            const dropzone = event.interaction.dropzone;
            if (currentLine && dropzone && dropzone.target.classList.contains('handle')) {
                const startHandle = event.target;
                const endHandle = dropzone.target;
                const startNode = startHandle.closest('.canvas-node');
                const endNode = endHandle.closest('.canvas-node');

                if (startNode.getAttribute('data-type') !== 'source' || endNode.getAttribute('data-type') !== 'destination') {
                    showStatus('Connections must go from a Source to a Destination.', 'error');
                    currentLine.remove();
                } else if (startNode !== endNode) {
                    currentLine.setOptions({ end: endHandle, color: '#4CAF50', dash: false });
                    lines.push({ line: currentLine, start: startHandle, end: endHandle });

                    // --- TRIGGER PREVIEW ---
                    const sourcePath = startNode.getAttribute('data-path');
                    const sourceFieldName = startHandle.parentElement.getAttribute('data-field-name');
                    const destFieldName = endHandle.parentElement.getAttribute('data-field-name');
                    const result = await window.electronAPI.getPreviewData({ filePath: sourcePath, fieldName: sourceFieldName });
                    if (result && !result.error) {
                        renderPreview(sourceFieldName, destFieldName, result.data);
                    } else if (result && result.error) {
                        showStatus(`Preview Error: ${result.error}`, 'error');
                    }
                    // --- END TRIGGER PREVIEW ---

                } else { currentLine.remove(); }
            } else { if (currentLine) currentLine.remove(); }
            currentLine = null;
        }
    }
});
interact('.handle').dropzone({ accept: '.handle', overlap: 'pointer' });

// --- UI Event Listeners ---
const addSourceBtn = document.getElementById('add-source-btn');
const sourceList = document.getElementById('source-list');
const addDestBtn = document.getElementById('add-dest-btn');
const destinationList = document.getElementById('destination-list');
const runTransferBtn = document.getElementById('run-transfer-btn');

addDestBtn.addEventListener('click', () => {
    const newItem = document.createElement('div');
    newItem.className = 'draggable-item';
    newItem.textContent = `New Destination-${Date.now() % 1000}`;
    newItem.setAttribute('data-type', 'destination');
    destinationList.appendChild(newItem);
    showStatus('New destination created in the panel.', 'info');
});

addSourceBtn.addEventListener('click', async () => {
    const fileData = await window.electronAPI.openFile();
    if (fileData && !fileData.error) {
        const newItem = document.createElement('div');
        newItem.className = 'draggable-item';
        newItem.textContent = fileData.path.split(/[\\/]/).pop();
        newItem.setAttribute('data-type', 'source');
        newItem.setAttribute('data-path', fileData.path);
        newItem.setAttribute('data-fields', JSON.stringify(fileData.fields));
        sourceList.appendChild(newItem);
        showStatus(`Added source: ${newItem.textContent}`, 'success');
    } else if (fileData && fileData.error) {
        showStatus(`Error adding source: ${fileData.error}`, 'error');
    }
});

runTransferBtn.addEventListener('click', async () => {
    if (lines.length === 0) {
        showStatus('No fields have been mapped. Please connect fields to run a transfer.', 'error');
        return;
    }
    const mappings = lines.map(lineInfo => ({
        source: { path: lineInfo.start.closest('.canvas-node').getAttribute('data-path'), fieldName: lineInfo.start.parentElement.getAttribute('data-field-name') },
        dest: { fieldName: lineInfo.end.parentElement.getAttribute('data-field-name') }
    }));
    showStatus('Running transfer...', 'info', 10000);
    const result = await window.electronAPI.runTransfer(mappings);
    if (result.success) {
        showStatus(result.message, 'success');
    } else {
        showStatus(`Error: ${result.error || result.message}`, 'error');
    }
});

function clearSelection() {
    if (selectedElement) {
        if (selectedElement.line) { selectedElement.line.setOptions({ color: '#4CAF50' }); }
        else { selectedElement.classList.remove('selected'); }
        selectedElement = null;
    }
}

document.addEventListener('click', (event) => {
    const path = event.composedPath();
    const canvas = path.find(el => el.matches && el.matches('#canvas-main'));
    const lineElement = path.find(el => el.matches && el.matches('.leader-line'));
    const nodeHeader = path.find(el => el.matches && el.matches('.node-header'));
    if (lineElement) {
        clearSelection();
        const lineInfo = lines.find(l => l.line.body === lineElement);
        if (lineInfo) { selectedElement = lineInfo; lineInfo.line.setOptions({ color: '#f5222d' }); }
    } else if (nodeHeader) {
        clearSelection();
        const node = nodeHeader.closest('.canvas-node');
        selectedElement = node;
        node.classList.add('selected');
    } else if (canvas) {
        clearSelection();
    }
});

document.addEventListener('keydown', (event) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        event.preventDefault();
        if (selectedElement.line) {
            selectedElement.line.remove();
            const index = lines.indexOf(selectedElement);
            if (index > -1) { lines.splice(index, 1); }
        } else {
            const node = selectedElement;
            const linesToRemove = lines.filter(l => l.start.closest('.canvas-node') === node || l.end.closest('.canvas-node') === node);
            linesToRemove.forEach(l => {
                l.line.remove();
                const index = lines.indexOf(l);
                if (index > -1) { lines.splice(index, 1); }
            });
            node.remove();
        }
        selectedElement = null;
        showStatus('Element deleted.', 'info');
    }
});

console.log('Renderer fully loaded.');
