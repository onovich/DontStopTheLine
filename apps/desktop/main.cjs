const { app, BrowserWindow, ipcMain } = require('electron');
const { readFile, writeFile } = require('node:fs/promises');
const { join } = require('node:path');

const SAVE_CHANNELS = new Set(['save:load', 'save:write']);
const savePath = () => join(app.getPath('userData'), 'save.json');

function registerSaveIpc() {
  ipcMain.handle('save:load', async () => readFile(savePath(), 'utf8').catch(() => null));
  ipcMain.handle('save:write', async (_event, value) => {
    if (typeof value !== 'string') throw new TypeError('Save payload must be a string.');
    await writeFile(savePath(), value, 'utf8');
  });
}

function createWindow() {
  const window = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.cjs'),
    },
  });
  window.loadURL(process.env.DSTL_WEB_URL || 'http://127.0.0.1:4173');
}

app.whenReady().then(() => {
  registerSaveIpc();
  createWindow();
});
module.exports = { SAVE_CHANNELS, registerSaveIpc };
