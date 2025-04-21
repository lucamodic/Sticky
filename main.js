const { app, BrowserWindow, ipcMain } = require('electron');
require('@electron/remote/main').initialize();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function createDashboard() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'dashboard', 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  require('@electron/remote/main').enable(win.webContents);
  win.loadFile(path.join('dashboard', 'dashboard.html'));
}

function createNoteWindow(id = Date.now(), mode = 'edit') {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'create-note', 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  require('@electron/remote/main').enable(win.webContents);
  win.loadFile(path.join('create-note', 'index.html'));
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('load-note', id, mode);
  });
}

function createViewWindow(id) {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: false,
    frame: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'view-note', 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  require('@electron/remote/main').enable(win.webContents);
  win.loadFile(path.join('view-note', 'view.html'));
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('load-note', id);
  });
}

// IPC listeners
ipcMain.on('new-note', (event) => {
  const id = Date.now();
  const noteData = { name: '', note: '', todos: [], reference: '' };

  fs.writeFileSync(path.join(dataDir, `note-${id}.json`), JSON.stringify(noteData));
  event.reply('note-created', id);
  createNoteWindow(id);
});

ipcMain.on('open-note', (event, id, mode = 'edit') => {
  createNoteWindow(id, mode);
});

ipcMain.on('view-note', (event, id) => {
  createViewWindow(id);
});

ipcMain.on('delete-note', (event, id) => {
  const notePath = path.join(dataDir, `note-${id}.json`);
  if (fs.existsSync(notePath)) fs.unlinkSync(notePath);
  event.sender.send('note-deleted');
});

ipcMain.handle('toggle-always-on-top', () => {
  const win = BrowserWindow.getFocusedWindow();
  const current = win?.isAlwaysOnTop() ?? false;
  win?.setAlwaysOnTop(!current);
  return !current;
});

ipcMain.handle('close-view-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(createDashboard);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
