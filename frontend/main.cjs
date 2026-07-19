const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let javaServerProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL('http://localhost:8585');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startJavaServer() {
  const isDev = !app.isPackaged;
  const jarPath = isDev 
    ? path.join(__dirname, '..', 'build', 'libs', 'netAnalyzer-0.0.1-SNAPSHOT.jar')
    : path.join(process.resourcesPath, 'backend.jar');
    
  const appDataPath = app.getPath('userData');
  const dbUrl = `jdbc:sqlite:${path.join(appDataPath, 'netanalyzer.db').replace(/\\/g, '/')}`;

  console.log('Starting Java Server from:', jarPath);
  console.log('Database URL:', dbUrl);

  javaServerProcess = spawn('java', [
    '-jar', jarPath,
    `--spring.datasource.url=${dbUrl}`,
    '--server.port=8585'
  ]);

  javaServerProcess.stdout.on('data', (data) => {
    console.log(`[Java]: ${data}`);
  });

  javaServerProcess.stderr.on('data', (data) => {
    console.error(`[Java Error]: ${data}`);
  });
}

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        clearInterval(interval);
        resolve();
      }).on('error', (err) => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error('Timeout waiting for server'));
        }
      });
    }, 1000);
  });
}

app.whenReady().then(async () => {
  startJavaServer();
  
  try {
    await waitForServer('http://localhost:8585');
    createWindow();
  } catch (err) {
    console.error('Failed to connect to Java server:', err);
    app.quit();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (javaServerProcess) {
    console.log('Killing Java Server');
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      spawn("taskkill", ["/pid", javaServerProcess.pid, '/f', '/t']);
    } else {
      javaServerProcess.kill('SIGINT');
    }
  }
});
