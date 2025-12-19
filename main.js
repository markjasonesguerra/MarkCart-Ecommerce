const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess; // Declare variable

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the React build
  win.loadURL('http://localhost:8800');
}

app.whenReady().then(() => {
  // Start the backend server ONCE, on port 8800
  backendProcess = spawn('node', [path.join(__dirname, 'backend', 'index.js')], {
    cwd: path.join(__dirname, 'backend'), 
    env: { ...process.env, PORT: 8800 },
    stdio: 'inherit',
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
  if (backendProcess) backendProcess.kill();
});