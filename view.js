const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let dataPath;
let data = { name: '', note: '', todos: [] };

ipcRenderer.on('load-note', (event, id) => {
  dataPath = path.join(__dirname, 'data', `note-${id}.json`);
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  const noteNameEl = document.getElementById('note-name');
  if (data.name && data.name.trim() !== '') {
    noteNameEl.textContent = data.name;
  } else {
    noteNameEl.style.display = 'none';
  }

  document.getElementById('note-text').textContent = data.note || '';

  // Conditionally render the To-Do section
  if (data.todos && data.todos.length > 0) {
    renderTodos();
  } else {
    document.querySelector('.todo-section').style.display = 'none';
  }
});

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
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    };
    li.append(" " + todo.text);
    todoList.appendChild(li);
    li.appendChild(checkbox);
  });
}

function togglePin() {
  const pinButton = document.querySelector('#pin-button');
  pinButton.classList.toggle('pinned');
  
  ipcRenderer.invoke('toggle-always-on-top');
  console.log("Pinned:", pinButton.classList.contains('pinned'));
}

function closeWindow() {
  ipcRenderer.invoke('close-view-window');
}

// Add event listener for keypress events (ESC and `)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeWindow();
  } else if (event.key === '`') { // backtick key
    togglePin();
  }
});
