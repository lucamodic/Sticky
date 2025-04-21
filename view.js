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
  const noteText = data.note || '';
  document.getElementById('note-text').innerHTML = noteText
    .replace(/\t/g, '<span class="tab"></span>')
    .replace(/\n/g, '<br>');

  // Conditionally render the To-Do section
  if (data.todos && data.todos.length > 0) {
    renderTodos();
  } else {
    document.querySelector('.todo-content').style.display = 'none';
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
    
    const textSpan = document.createElement('span');
    textSpan.textContent = todo.text;
    
    li.appendChild(textSpan);
    li.appendChild(checkbox);
    todoList.appendChild(li);
  });
}

function togglePin() {
  ipcRenderer.invoke('toggle-always-on-top');
}

function closeWindow() {
  ipcRenderer.invoke('close-view-window');
}

// Add event listener for keypress events (ESC and `)
document.addEventListener('keydown', (event) => {
  console.log('Key pressed:', event.key, event.code); // 👈 Check both!
  if (event.key === 'Escape') {
    closeWindow();
  } else if (event.key === '`') {
    togglePin();
  }
});
