const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import node-fetch with compatibility for newer versions
let fetch;
try {
  const nodeFetch = require('node-fetch');
  fetch = nodeFetch.default || nodeFetch;
} catch (error) {
  console.error('Error loading node-fetch:', error);
  fetch = async (url) => {
    console.error('Fetch failed to load, cannot request:', url);
    return { json: async () => ({}) };
  };
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  setInterval(async () => {
    try {
      const response = await fetch('http://localhost:5001/status');
      const data = await response.json();

      if (mainWindow) {
        mainWindow.webContents.send('status-update', data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }, 1000);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});