import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mozheDesktop', {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  notify: (title: string, body: string) => ipcRenderer.invoke('system:notify', title, body),
  openPath: (target: string) => ipcRenderer.invoke('system:open-path', target)
});
