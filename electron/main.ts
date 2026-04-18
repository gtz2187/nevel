import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork, ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

function getRendererUrl() {
  return 'http://localhost:5173';
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1160,
    minHeight: 760,
    title: '墨者',
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#111111',
    transparent: false,
    vibrancy: 'sidebar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    void mainWindow.loadURL(getRendererUrl());
  } else {
    void mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }
}

function maybeStartServer() {
  if (isDev) return;
  const appPath = app.getAppPath();
  const candidateEntries = [
    path.join(appPath, 'dist-server/server/main.js'),
    path.join(appPath, 'dist-server/main.js')
  ];
  const entry = candidateEntries.find((file) => existsSync(file));
  if (!entry) {
    console.error('[mozhe] Nest server entry not found:', candidateEntries);
    return;
  }
  serverProcess = fork(entry, [], {
    stdio: 'ignore',
    detached: false
  });
}

app.whenReady().then(() => {
  maybeStartServer();
  createMainWindow();

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  ipcMain.handle('dialog:select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('system:notify', async (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return true;
  });

  ipcMain.handle('system:open-path', async (_event, target: string) => {
    return shell.openPath(target);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  serverProcess?.kill();
});
