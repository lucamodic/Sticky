const { ipcRenderer } = require('electron');
const remote = require('@electron/remote'); // ✅ correct way!

const fs = require('fs');
const path = require('path');

// Get the correct app data path
const notesDir = path.join(remote.app.getPath('userData'), 'data');
const noteList = document.getElementById('note-list');

function loadNotes() {
  console.log('Loading notes from:', notesDir);  // Debug log
  
  if (!fs.existsSync(notesDir)) {
    console.log('Notes directory does not exist');
    return;
  }

  try {
    const files = fs.readdirSync(notesDir).filter(f => f.startsWith('note-'));
    console.log('Found note files:', files);  // Debug log
    
    noteList.innerHTML = '';

    files.forEach(file => {
      try {
        const filePath = path.join(notesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const noteData = JSON.parse(fileContent);
        const id = file.match(/\d+/)[0];

        const li = document.createElement('li');
        li.className = 'note-item';

        const title = document.createElement('span');
        title.className = 'note-title';
        title.textContent = noteData.name || noteData.reference || 'Untitled Note';
        if (noteData.name) {
          title.setAttribute('title', noteData.name);  // Show full name on hover
        }

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-view';
        viewBtn.innerHTML = '<i class="icon-eye"></i> View';
        viewBtn.onclick = () => ipcRenderer.send('view-note', id);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '<i class="icon-edit"></i> Edit';
        editBtn.onclick = () => ipcRenderer.send('open-note', id, 'edit');

        actions.appendChild(viewBtn);
        actions.appendChild(editBtn);
        li.appendChild(title);
        li.appendChild(actions);
        noteList.appendChild(li);

      } catch (err) {
        console.error(`Error loading note ${file}:`, err);
      }
    });

  } catch (err) {
    console.error('Error reading notes directory:', err);
  }
}

function createNote() {
  ipcRenderer.send('new-note');
}

// Refresh notes every 2 seconds (optional)
setInterval(loadNotes, 2000);

// Initial load and event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  document.getElementById('new-note-btn').addEventListener('click', createNote);
});

ipcRenderer.on('note-created', loadNotes);
ipcRenderer.on('note-deleted', loadNotes);