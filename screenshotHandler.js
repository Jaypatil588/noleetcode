const { desktopCapturer } = require('electron');
const fs = require('fs');
const path = require('path');
const { screen } = require('electron'); // to get the screen resolution

const screenshotHandler = async (win) => {
  // Hide the window
  win.hide();

  // Wait for 500ms
  setTimeout(async () => {
    try {
      const screenshotBuffer = await captureScreenshot();
      const filePath = path.join('C:/screenshots', 'screenshot.png');
      
      // Save the screenshot
      fs.writeFileSync(filePath, screenshotBuffer);
      console.log(`Screenshot saved to ${filePath}`);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }

    // Show the window again
    win.show();
  }, 500);
};

const captureScreenshot = async () => {
  // Get screen resolution (this will return the primary display resolution)
  const { width, height } = screen.getPrimaryDisplay().size;

  // Request full screen capture with the actual screen resolution
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height } // Set to the native screen resolution
  });

  if (sources.length === 0) {
    throw new Error('No screen sources found');
  }

  const screenSource = sources[0];

  // Capture the entire screen at native resolution
  const screenshot = screenSource.thumbnail.toPNG();
  
  return screenshot;
};

module.exports = screenshotHandler;
