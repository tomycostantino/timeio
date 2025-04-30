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

contextBridge.exposeInMainWorld('database', {
        executeQuery: (query, data) => {
            const validQueries = ['store-session', 'update-session', 'get-sessions', 'get-active-session', 'delete-session'];
            if (!validQueries.includes(query)) return Promise.reject(new Error('Query not allowed'));
            return ipcRenderer.invoke(query, data);
        },
        ipcRenderer: {
            invoke: (channel, data) => {
                const validChannels = ['store-session', 'get-sessions', 'get-active-session', 'delete-session'];
                if (validChannels.includes(channel)) {
                    return ipcRenderer.invoke(channel, data);
                }
                return Promise.reject(new Error(`Channel ${channel} is not allowed`));
            }
        }
    }
);
