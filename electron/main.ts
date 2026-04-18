import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type ClosableServer = {
  close: () => Promise<void>;
};

type ServerModule = {
  startServer: () => Promise<ClosableServer>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let serverApp: ClosableServer | null = null;

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

function getServerEntryPath() {
  return path.join(app.getAppPath(), 'dist-server/server/main.js');
}

async function maybeStartServer() {
  if (isDev) return;

  try {
    const entryUrl = pathToFileURL(getServerEntryPath()).href;
    const serverModule = await import(entryUrl) as ServerModule;
    serverApp = await serverModule.startServer();
  } catch (error) {
    console.error('[mozhe] failed to start bundled server:', error);
  }
}

app.whenReady().then(async () => {
  await maybeStartServer();
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

app.on('before-quit', async () => {
  await serverApp?.close();
});
