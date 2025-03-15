const { app, BrowserWindow, globalShortcut } = require("electron");
const screenshotHandler = require("./components/screenshotHandler");

const state = {
  mainWindow: null,
  windowPosition: { x: 100, y: 30 },
  windowSize: { width: 1000, height: 1200 },
  isWindowVisible: true,
};

const windowSettings = {
  width: state.windowSize.width,
  height: state.windowSize.height,
  x: state.windowPosition.x,
  y: state.windowPosition.y,
  transparent: true,
  resizable: true,
  frame: false,
  backgroundColor: "#000000B3",
  type: "panel",
  paintWhenInitiallyHidden: true,
  hasShadow: false,
  fullscreenable: false,
  skipTaskbar: true,
  focusable: false,
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

  state.mainWindow.webContents.on("did-finish-load", () => {
    // Bind the ctrl+N shortcut
    globalShortcut.register("Ctrl+N", () => {
      screenshotHandler(state.mainWindow,1); 
    });

        // Bind the ctrl+N shortcut
    globalShortcut.register("Ctrl+M", () => {
      screenshotHandler(state.mainWindow,2); 
    });
  });

  state.mainWindow.webContents.setBackgroundThrottling(false);
  state.mainWindow.webContents.setFrameRate(60);

  state.mainWindow.loadFile('index.html');
  //state.mainWindow.webContents.openDevTools();


  state.mainWindow.setOpacity(0.8);
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
    //state.mainWindow.setIgnoreMouseEvents(false, { forward: false });

    state.mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    state.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    state.mainWindow.setOpacity(0); // Set window opacity to 0 (invisible)
    state.mainWindow.hide(); // Physically hide the window
    state.isWindowVisible = false; // Update visibility state
  } else {
    // Keep mouse events passing through, no need to change that
    state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    //state.mainWindow.setIgnoreMouseEvents(false, { forward: false });

    state.mainWindow.setOpacity(0.7); // Set opacity to 70% for visibility
    state.mainWindow.show(); // Physically show the window again
    state.isWindowVisible = true; // Update visibility state
  }
}

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
  globalShortcut.register("CommandOrControl+B", toggleMainWindow);
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
