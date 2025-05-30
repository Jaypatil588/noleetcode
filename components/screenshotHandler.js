const { desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { processScreenshot } = require("./fetchResponse");
const { screen } = require("electron");

function parsePlainTextResponse(responseText) {
  const regex =/SUMMARY\s*([\s\S]*?)\n\s*THOUGHTS\s*([\s\S]*?)\n\s*CODE\s*([\s\S]*?)\n\s*COMPLEXITY\s*([\s\S]*)/;
  const matches = responseText.match(regex);

  if (!matches) {
    throw new Error("Response format does not match the expected pattern");
  }

  const [, title, thoughts, code, complexity] = matches;
  return {
    title: title.replace(/^[:\n\s*]+/, "").trim(),
    thoughts: thoughts.replace(/^[:\n\s*]+/, "").replace(/\*/g, "").trim(),
    code : code.replace(/^[^a-zA-Z0-9]*```python\s*\n?/, "").replace(/\n*```\s*$/, "").trim(),
    complexity: complexity.replace(/^[:\n\s*]+/, "").trim().trim()
  };
}

const screenshotHandler = async (win,num) => {
  await win.webContents.executeJavaScript(`
    document.getElementById("screenshot-container").classList.add("hidden");
    document.getElementById("loading-container").classList.remove("hidden");
  `);
  setTimeout(async () => {
    try {
      const screenshotBuffer = await captureScreenshot();
      const filePath = path.join("C:/screenshots", "screenshot.png");

      fs.writeFileSync(filePath, screenshotBuffer);
      //console.log(`Screenshot saved to ${filePath}`);

      let current_response = await handleScreenshotEvent(filePath,num,win);
      const parsed = parsePlainTextResponse(current_response);
      await win.webContents.executeJavaScript(`
        document.getElementById("loadingspan").textContent = ("");
      `);
      console.log(JSON.stringify(parsed.thoughts));
      await win.webContents.executeJavaScript(`
        document.getElementById("title").textContent = ${JSON.stringify(parsed.title)};

        document.getElementById("thoughts").innerHTML = "<ol><li>" + 
          ${JSON.stringify(parsed.thoughts)}.split("\\n").join("</li><li>") + "</li></ol>";

        document.getElementById("code").textContent = ${JSON.stringify(parsed.code)};
        document.getElementById("code").removeAttribute("data-highlighted");
        hljs.highlightElement(document.getElementById("code"));


        document.getElementById("complexity").innerHTML = "<ol><li>" + 
          ${JSON.stringify(parsed.complexity)}.split("\\n").join("</li><li>") + "</li></ol>";
    `);
    

      await win.webContents.executeJavaScript(`
        document.getElementById("screenshot-container").classList.remove("hidden");
        document.getElementById("loading-container").classList.add("hidden");
        `);
    } catch (error) {
      console.error("Error setting parsed values", error);
      await win.webContents.executeJavaScript(`
        document.getElementById("loading-container").classList.remove("hidden");
        document.getElementById("loadingspan").textContent =  ${JSON.stringify(error.message + ": Key error")};
      `);
    }
  }, 100);
};

async function handleScreenshotEvent(screenshotPath,num,win) {
  return await processScreenshot(screenshotPath,num,win);
}

const captureScreenshot = async () => {
  const { width, height } = screen.getPrimaryDisplay().size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height },
  });

  if (sources.length === 0) {
    throw new Error("No screen sources found");
  }

  const screenSource = sources[0];

  // Capture the entire screen at native resolution
  const screenshot = screenSource.thumbnail.toPNG();

  return screenshot;
};

module.exports = screenshotHandler;
