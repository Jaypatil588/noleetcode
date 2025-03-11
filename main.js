const { app, BrowserWindow, globalShortcut } = require("electron");
const screenshotHandler = require("./screenshotHandler");

const state = {
  mainWindow: null,
  windowPosition: { x: 100, y: 100 },
  windowSize: { width: 600, height: 400 },
  isWindowVisible: true,
};

// Base window settings with our desired properties
const windowSettings = {
  width: state.windowSize.width,
  height: state.windowSize.height,
  x: state.windowPosition.x,
  y: state.windowPosition.y,
  transparent: true,
  frame: false,
  // Use a black background with 70% opacity (hex: #000000B3)
  backgroundColor: "#000000B3",
  type: "panel",
  paintWhenInitiallyHidden: true,
  hasShadow: false,
  fullscreenable: false,
  skipTaskbar: true,
  focusable: true,
  enableLargerThanScreen: true,
  movable: true,
  titleBarStyle: "hidden",
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    scrollBounce: true,
  },
};

function createWindow() {
    state.mainWindow = new BrowserWindow(windowSettings);
    state.mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // Screen Capture Protection measures
    state.mainWindow.setContentProtection(true);
    state.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    state.mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  
    // macOS-specific protections
    if (process.platform === "darwin") {
      state.mainWindow.setHiddenInMissionControl(true);
      state.mainWindow.setWindowButtonVisibility(false);
      state.mainWindow.setBackgroundColor("#000000B3");
      state.mainWindow.setSkipTaskbar(true);
      state.mainWindow.setHasShadow(false);
    }
  
    // Add this inside the createWindow function or wherever you initialize the BrowserWindow
    state.mainWindow.webContents.on("did-finish-load", () => {
      // Bind the ctrl+N shortcut
      globalShortcut.register("Ctrl+N", () => {
        screenshotHandler(state.mainWindow); // Use state.mainWindow here
      });
    });
  
    // Performance and rendering settings
    state.mainWindow.webContents.setBackgroundThrottling(false);
    state.mainWindow.webContents.setFrameRate(60);
  
    // Load HTML with black background at 70% opacity
    state.mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
          <title>Hello World Overlay</title>
          <style>
            body { margin: 0; background-color: rgba(0, 0, 0, 0.7); }
            h1 { color: white; font-family: sans-serif; text-align: center; margin-top: 100px; }
          </style>
        </head>
        <body>
          <h1>Hello World</h1>
        </body>
      </html>
    `);
  
    // Set initial visible opacity to 0.7 (70% visible)
    state.mainWindow.setOpacity(0.7);
  }
  

// Window state management: toggling visibility with opacity and mouse events
function toggleMainWindow() {
    if (!state.mainWindow) return;
  
    if (state.isWindowVisible) {
      const bounds = state.mainWindow.getBounds();
      state.windowPosition = { x: bounds.x, y: bounds.y };
      state.windowSize = { width: bounds.width, height: bounds.height };
  
      // Allow mouse events to pass through when hiding the window
      state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
      state.mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
      state.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      state.mainWindow.setOpacity(0);  // Set window opacity to 0 (invisible)
      state.mainWindow.hide();         // Physically hide the window
      state.isWindowVisible = false;   // Update visibility state
    } else {
      // Keep mouse events passing through, no need to change that
      state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
      state.mainWindow.setOpacity(0.7); // Set opacity to 70% for visibility
      state.mainWindow.show();          // Physically show the window again
      state.isWindowVisible = true;     // Update visibility state
    }
  }
  

//TEST 3

const moveStep = 10;
function moveWindowLeft() {
  if (!state.mainWindow) return;
  const [x, y] = state.mainWindow.getPosition();
  state.mainWindow.setPosition(x - moveStep, y);
}
function moveWindowRight() {
  if (!state.mainWindow) return;
  const [x, y] = state.mainWindow.getPosition();
  state.mainWindow.setPosition(x + moveStep, y);
}
function moveWindowUp() {
  if (!state.mainWindow) return;
  const [x, y] = state.mainWindow.getPosition();
  state.mainWindow.setPosition(x, y - moveStep);
}
function moveWindowDown() {
  if (!state.mainWindow) return;
  const [x, y] = state.mainWindow.getPosition();
  state.mainWindow.setPosition(x, y + moveStep);
}

function registerShortcuts() {
  // Toggle window visibility via F1 and CommandOrControl+B
  globalShortcut.register("F1", toggleMainWindow);
  globalShortcut.register("CommandOrControl+B", toggleMainWindow);

  // Movement controls via CommandOrControl + Arrow keys
  globalShortcut.register("CommandOrControl+Left", moveWindowLeft);
  globalShortcut.register("CommandOrControl+Right", moveWindowRight);
  globalShortcut.register("CommandOrControl+Up", moveWindowUp);
  globalShortcut.register("CommandOrControl+Down", moveWindowDown);
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});
