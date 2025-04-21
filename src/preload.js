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

contextBridge.exposeInMainWorld('trackerStateManager', {
  getState: () => ipcRenderer.invoke('get-tracker-state'),
  updateState: (newState) => ipcRenderer.invoke('update-tracker-state', newState)
});

contextBridge.exposeInMainWorld(
    'database',
    {
        ipcRenderer: {
            invoke: (channel, data) => {
                const validChannels = ['store-session', 'get-sessions', 'delete-session'];
                if (validChannels.includes(channel)) {
                    return ipcRenderer.invoke(channel, data);
                }
                return Promise.reject(new Error(`Channel ${channel} is not allowed`));
            }
        }
    }
);
