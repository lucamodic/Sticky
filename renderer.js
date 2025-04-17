const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let dataPath;
let data = { name: '', note: '', todos: [] };

const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('noteId');
const mode = urlParams.get('mode');

if (noteId) {
  const id = parseInt(noteId);
  dataPath = path.join(__dirname, 'data', `note-${id}.json`);
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }
  document.getElementById('note-name').value = data.name;
  document.getElementById('note').value = data.note;
  document.getElementById('reference').value = data.reference;
  renderTodos();
}


ipcRenderer.on('load-note', (event, id, mode = 'edit') => {
  dataPath = path.join(__dirname, 'data', `note-${id}.json`);
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  document.getElementById('note-name').value = data.name;
  document.getElementById('note').value = data.note;
  document.getElementById('reference').value = data.reference;
  renderTodos();

  if (mode === 'view') {
    window.isViewMode = true;

    // Hide the delete button only
    const deleteBtn = document.querySelector('.note-actions button[onclick="deleteNote()"]');
    
  }
});


ipcRenderer.on('note-deleted', () => {
  loadNotes();  // Refresh the note list when a note is deleted
});


// Save the data whenever the note is updated
function saveData() {
  if (dataPath) {
    data.name = document.getElementById('note-name').value; // Save name
    data.reference = document.getElementById('reference').value; // Save name
    data.note = document.getElementById('note').value; // Save note content
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
}

document.getElementById('note-name').addEventListener('input', saveData); // Save on name change
document.getElementById('note').addEventListener('input', saveData);
document.getElementById('reference').addEventListener('input', saveData);

function renderTodos() {
  const todoList = document.getElementById('todo-list');
  todoList.innerHTML = '';
  data.todos.forEach((todo, i) => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.onchange = () => {
      data.todos[i].done = !data.todos[i].done;
      saveData();
      renderTodos();
    };
    li.appendChild(checkbox);
    li.append(" " + todo.text);
    todoList.appendChild(li);
  });
}

function addTodo() {
  if (window.isViewMode) return;

  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (text) {
    // Add the new to-do to the data.todos array
    data.todos.push({ text, done: false });
    input.value = ''; // Clear the input field
    saveData(); // Save the new to-do
    renderTodos(); // Re-render the to-do list
  }
}


async function togglePin() {
  const result = await ipcRenderer.invoke('toggle-always-on-top');
  console.log("Pinned:", result);
  const pinButton = document.getElementById('pin-button');
  pinButton.classList.toggle('pinned');
}

function deleteNote() {
  if (!dataPath) return;
  fs.unlinkSync(dataPath);  // Delete the note from the filesystem
  
  // Notify the dashboard that the note was deleted
  const id = path.basename(dataPath).match(/\d+/)[0];
  ipcRenderer.send('delete-note', id);  // Notify main process
  
  const remote = require('@electron/remote');
  const win = remote.getCurrentWindow();
  win.close();  // Close the current note window
}
