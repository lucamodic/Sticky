const { app, BrowserWindow, ipcMain } = require('electron');
require('@electron/remote/main').initialize();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
console.log(dataDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function createDashboard() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload JS for communication
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  require('@electron/remote/main').enable(win.webContents);
  win.loadFile('dashboard.html');
}

function createNoteWindow(id = Date.now(), mode = 'edit') {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('load-note', id, mode);
  });

  require('@electron/remote/main').enable(win.webContents);
}

function createViewWindow(id) {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('view.html');
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('load-note', id);
  });

  require('@electron/remote/main').enable(win.webContents);
}


// IPC to create a new note
ipcMain.on('new-note', (event) => {
  const id = Date.now();
  const noteData = { name: '', note: '', todos: [] };

  // Save the new note to the filesystem
  fs.writeFileSync(path.join(dataDir, `note-${id}.json`), JSON.stringify(noteData));

  // Notify the renderer (dashboard) that a new note has been created
  event.reply('note-created', id);

  // Create the note window
  createNoteWindow(id);
});

// IPC to open an existing note
ipcMain.on('open-note', (event, id, mode = 'edit') => {
  createNoteWindow(id, mode);
});

ipcMain.on('view-note', (event, id) => {
  createViewWindow(id);
});


ipcMain.on('delete-note', (event, id) => {
  const notePath = path.join(dataDir, `note-${id}.json`);
  if (fs.existsSync(notePath)) {
    fs.unlinkSync(notePath);  // Delete the note from the filesystem
  }

  // Notify all renderers (dashboard) that the note has been deleted
  event.sender.send('note-deleted');
});


// Handle pin/unpin
ipcMain.handle('toggle-always-on-top', () => {
  const win = BrowserWindow.getFocusedWindow();
  const current = win?.isAlwaysOnTop() ?? false;
  win?.setAlwaysOnTop(!current);
  return !current;
});

app.whenReady().then(() => {
  createDashboard();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('close-view-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
