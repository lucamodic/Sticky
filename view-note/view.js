const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let dataPath;
let data = { name: '', note: '', todos: [] };

ipcRenderer.on('load-note', (event, id) => {
  dataPath = path.join(__dirname, '..', 'data', `note-${id}.json`);
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  const title = document.getElementById('note-name');
  title.textContent = data.name || '';
  title.style.display = data.name ? 'block' : 'none';

  const content = document.getElementById('note-text');
  content.innerHTML = (data.note || '')
    .replace(/\t/g, '<span class="tab"></span>')
    .replace(/\n/g, '<br>');

    renderTodos();
});


function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  data.todos.forEach((todo, i) => {
    const li = document.createElement('li');

    const text = document.createElement('span');
    text.textContent = todo.text;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.onchange = () => {
      data.todos[i].done = !data.todos[i].done;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    };

    li.appendChild(text);
    li.appendChild(checkbox);
    list.appendChild(li);
  });
}

function togglePin() {
  ipcRenderer.invoke('toggle-always-on-top');
}

function closeWindow() {
  ipcRenderer.invoke('close-view-window');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeWindow();
  if (event.key === '`') togglePin();
});
