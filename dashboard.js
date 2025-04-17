const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, 'data');
const noteList = document.getElementById('note-list');

// Load notes from the filesystem
function loadNotes() {
  if (!fs.existsSync(notesDir)) return;
  const files = fs.readdirSync(notesDir).filter(f => f.startsWith('note-'));
  noteList.innerHTML = '';

  files.forEach(file => {
  const id = file.match(/\d+/)[0];
    const filePath = path.join(notesDir, file);
    const noteData = JSON.parse(fs.readFileSync(filePath));

    const li = document.createElement('li');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('note-title');
    titleSpan.textContent = noteData.name || 'Untitled';


    const actionsDiv = document.createElement('note-actions');
    actionsDiv.classList.add('note-actions');

    const viewBtn = document.createElement('button');
    viewBtn.textContent = '🔍 View';
    viewBtn.onclick = () => {
      ipcRenderer.send('view-note', id);
    };


    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ Edit';
    editBtn.classList.add('edit-btn');
    editBtn.onclick = () => {
      ipcRenderer.send('open-note', id, 'edit');
    };

    actionsDiv.appendChild(viewBtn);
    actionsDiv.appendChild(editBtn);

    li.appendChild(titleSpan);
    li.appendChild(actionsDiv);
    noteList.appendChild(li);
  });
}

function createNote() {
  ipcRenderer.send('new-note');
}

ipcRenderer.on('note-created', () => {
  loadNotes();
});

ipcRenderer.on('note-deleted', () => {
  loadNotes();
});

loadNotes();
