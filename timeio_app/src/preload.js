const { contextBridge, ipcRenderer } = require('electron');

const outputListeners = new Set();
const errorListeners = new Set();

contextBridge.exposeInMainWorld('time_tracker', {
    sendTrackerCommand: (command) => ipcRenderer.send('tracker-command', command),

    onTrackerUsageStatus: (callback) => ipcRenderer.on('tracker-usage-status', (event, data) => callback(data)),
    onTrackerStatus: (callback) => ipcRenderer.on('tracker-status', (event, status) => callback(status)),

    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('tracker-usage-status');
        ipcRenderer.removeAllListeners('tracker-status');
        outputListeners.clear();
        errorListeners.clear();
    }
});
