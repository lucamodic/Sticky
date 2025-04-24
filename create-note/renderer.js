const { ipcRenderer } = require('electron');
const fs = require('fs');

let dataPath = '';
let data = { name: '', note: '', todos: [], reference: '' };

ipcRenderer.on('load-note', (event, id, pathFromMain, mode = 'edit') => {
  dataPath = pathFromMain;
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  document.getElementById('note-name').value = data.name || '';
  document.getElementById('note').value = data.note || '';
  document.getElementById('reference').value = data.reference || '';
  renderTodos();

  if (mode === 'view') {
    window.isViewMode = true;
    document.getElementById('delete-button')?.remove();
  }
});

function saveData() {
  if (!dataPath) {
    console.error('No data path set!');
    return;
  }
  
  try {
    data.name = document.getElementById('note-name').value;
    data.note = document.getElementById('note').value;
    data.reference = document.getElementById('reference').value;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('Note saved successfully to:', dataPath);
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

document.getElementById('note-name').addEventListener('input', saveData);
document.getElementById('note').addEventListener('input', saveData);
document.getElementById('reference').addEventListener('input', saveData);

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
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
    list.appendChild(li);
  });
}

function addTodo() {
  if (window.isViewMode) return;
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (text) {
    data.todos.push({ text, done: false });
    input.value = '';
    saveData();
    renderTodos();
  }
}

function deleteNote() {
  if (!dataPath) return;

  const id = dataPath.match(/note-(\d+)\.json$/)?.[1];
  if (!id) {
    console.error('Could not extract note ID');
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this note?");
  if (!confirmed) return;

  ipcRenderer.send('delete-note', id);
  window.close();
}
