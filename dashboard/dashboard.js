const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '..', 'data');
const noteList = document.getElementById('note-list');

function loadNotes() {
  if (!fs.existsSync(notesDir)) return;
  const files = fs.readdirSync(notesDir).filter(f => f.startsWith('note-'));
  noteList.innerHTML = '';

  files.forEach(file => {
    const id = file.match(/\d+/)[0];
    const noteData = JSON.parse(fs.readFileSync(path.join(notesDir, file)));

    const li = document.createElement('li');

    const title = document.createElement('span');
    title.classList.add('note-title');
    title.textContent = noteData.reference || 'Untitled';

    const actions = document.createElement('div');
    actions.classList.add('note-actions');

    const viewBtn = document.createElement('button');
    viewBtn.textContent = '🔍 View';
    viewBtn.onclick = () => ipcRenderer.send('view-note', id);

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ Edit';
    editBtn.onclick = () => ipcRenderer.send('open-note', id, 'edit');

    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    li.appendChild(title);
    li.appendChild(actions);
    noteList.appendChild(li);
  });
}

function createNote() {
  ipcRenderer.send('new-note');
}

ipcRenderer.on('note-created', loadNotes);
ipcRenderer.on('note-deleted', loadNotes);

loadNotes();
