const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'dstlSave',
  Object.freeze({
    load: () => ipcRenderer.invoke('save:load'),
    write: (value) => ipcRenderer.invoke('save:write', value),
  }),
);
