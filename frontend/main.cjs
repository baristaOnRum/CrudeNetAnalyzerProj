const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let javaServerProcess;

// En dev cargamos desde Vite (hot reload); en producción desde Spring Boot
const isDev = !app.isPackaged;
const FRONTEND_URL = isDev ? 'http://127.0.0.1:3000' : 'http://127.0.0.1:8585';
const BACKEND_URL  = 'http://127.0.0.1:8585';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(FRONTEND_URL);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startJavaServer() {
  const jarPath = isDev
    ? path.join(__dirname, '..', 'build', 'libs', 'netAnalyzer-0.0.1-SNAPSHOT.jar')
    : path.join(process.resourcesPath, 'backend.jar');

  const appDataPath = app.getPath('userData');
  const dbUrl = `jdbc:sqlite:${path.join(appDataPath, 'netanalyzer.db').replace(/\\/g, '/')}`;

  console.log('[Electron] Starting Java Server from:', jarPath);
  console.log('[Electron] Database URL:', dbUrl);

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

function waitForServer(url, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`[Electron] Waiting for server at ${url}...`);
    const interval = setInterval(() => {
      http.get(url, (res) => {
        clearInterval(interval);
        console.log(`[Electron] Server ready at ${url}`);
        resolve();
      }).on('error', () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for server at ${url}`));
        }
      });
    }, 1000);
  });
}

app.whenReady().then(async () => {
  // En dev, el backend ya fue iniciado por Gradle (runApp).
  // En producción empaquetada, lo iniciamos nosotros.
  if (!isDev) {
    startJavaServer();
  }

  try {
    // Esperar al backend siempre (para APIs)
    await waitForServer(BACKEND_URL);

    // En dev también esperar al dev server de Vite
    if (isDev) {
      await waitForServer(FRONTEND_URL);
    }

    createWindow();
  } catch (err) {
    console.error('[Electron] Failed to connect to server:', err);
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
    console.log('[Electron] Killing Java Server');
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      spawn('taskkill', ['/pid', javaServerProcess.pid, '/f', '/t']);
    } else {
      javaServerProcess.kill('SIGINT');
    }
  }
});
