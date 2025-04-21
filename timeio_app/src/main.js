const { app, BrowserWindow, ipcMain} = require('electron');
const { spawn } = require('child_process');
const path = require('node:path');

let mainWindow;
let trackerProcess = null;

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

    const pythonScriptPath = path.join(__dirname, '..', '..', 'time_tracker.py');

    trackerProcess = spawn('python', [pythonScriptPath]);

    console.log(`Started Python process with PID: ${trackerProcess.pid}`);

    trackerProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        try {
            const jsonOutput = JSON.parse(output);
            console.log(`Python stdout: ${output}`);
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

    /*
    trackerProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        console.error(`Python stderr: ${error}`);
        if (mainWindow) {
            mainWindow.webContents.send('python-error', { error: error });
        }
    });

    trackerProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
         if (mainWindow) {
             mainWindow.webContents.send('python-status', { status: 'exited', code: code });
         }
        trackerProcess = null;
    });

     trackerProcess.on('error', (err) => {
         console.error('Failed to start or communicate with Python process:', err);
          if (mainWindow) {
             mainWindow.webContents.send('python-status', { status: 'error', message: err.message });
          }
         trackerProcess = null;
     });
    */
}

function sendTrackerCommand(command) {
    if (trackerProcess) {
        // console.log(`Sending command to Python: ${command}`);
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

