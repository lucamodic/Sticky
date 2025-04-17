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

  document.getElementById('note-name').textContent = data.name || '';
  document.getElementById('note-text').textContent = data.note || '';
  
  // Conditionally render the To-Do section
  if (data.todos && data.todos.length > 0) {
    renderTodos();
  } else {
    document.querySelector('.todo-section').style.display = 'none'; // Hide todo section if no todos
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
    li.appendChild(checkbox);
    li.append(" " + todo.text);
    todoList.appendChild(li);
  });
}

function togglePin() {
  const pinButton = document.querySelector('.top-bar button');  // Obtener el botón
  pinButton.classList.toggle('pinned');  
  
  const result = ipcRenderer.invoke('toggle-always-on-top');
  console.log("Pinned:", result);
}
