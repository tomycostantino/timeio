const { app, BrowserWindow, ipcMain} = require('electron');
const { spawn } = require('child_process');
const path = require('node:path');
const { initDatabase, closeDatabase } = require('../database/database.js');

let mainWindow;
let trackerProcess = null;
let trackerState = {
  isRunning: false,
  elapsedTime: 0,
  description: "",
  appUsage: null,
  processStatus: null,
  error: null,
  startTime: null
};

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  initDatabase();
  startTracker();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
    if (trackerProcess) {
        closeDatabase();
        // Send the exit command and kill process
        trackerProcess.stdin.write('exit\n');
         setTimeout(() => {
             if (trackerProcess && !trackerProcess.killed) {
                 trackerProcess.kill();
             }
         }, 2000);
    }
});

function startTracker() {
    if (trackerProcess) {
        console.log("Python process is already running.");
        return;
    }

    const pythonScriptPath = path.join(__dirname, '..', '..', 'python', 'time_tracker.py');

    trackerProcess = spawn('python', [pythonScriptPath]);

    console.log(`Started Python process with PID: ${trackerProcess.pid}`);

    trackerProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        try {
            const jsonOutput = JSON.parse(output);
            if (mainWindow) {
                if (jsonOutput.status) {
                    mainWindow.webContents.send('tracker-status', jsonOutput);
                } else if (jsonOutput.usage_data) {
                    mainWindow.webContents.send('tracker-usage-status', jsonOutput);
                }
            }
        } catch (e) {
            console.error(`Failed to parse Python stdout as JSON: ${output}`, e);
             if (mainWindow) {
                 mainWindow.webContents.send('tracker-status', { status: "error", message: output });
             }
        }
    });
}

function sendTrackerCommand(command) {
    if (trackerProcess) {
        trackerProcess.stdin.write(`${command}\n`);
    } else {
        console.warn(`Python process not running. Cannot send command: ${command}`);
         if (mainWindow) {
             mainWindow.webContents.send('python-status', { status: 'command-failed', command: command, reason: 'Process not running' });
         }
    }
}

ipcMain.on('tracker-command', (event, command) => {
    sendTrackerCommand(command);
});


ipcMain.handle('get-tracker-state', () => {
  return trackerState;
});

ipcMain.handle('update-tracker-state', (event, newState) => {
  trackerState = { ...trackerState, ...newState };
  return trackerState;
});

