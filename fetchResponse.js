const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Setup the generative model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Function to process the screenshot
const processScreenshot = async (filePath) => {
    try {
      const base64EncodedData = await getBase64(filePath);
      const mimeType = "image/png";
  
      const userMessage = `You are roleplaying as a software developer, focused on solving DSA and leetcode problems. \
You need to solve the problem provided in this image with least amount of code possible, while maintaining code verbosity and explaining the segments separately as you go. \
Explain in simple language, write 'my thoughts' section to explain it as me, in bullet points. \
Now, this is important, to provide the optimal code, search the problem statement and the problem title over the internet, fetch the most popular user submission, and then use that to provide me with a solution. It should not exceed Time limit, assume test cases can get very large in the end. \
Your only task is to make sure the code runs on first attempt, and that it should not look ai generated. \
It should look as if written by a human, by me. Keep explanations short and to the point. \
The format of your response should be strictly like this, including headers:
TITLE,
THOUGHTS,
CODE,
COMPLEXITY
`;
  
      const result = await model.generateContent({
        contents: [
          {
            parts: [
              { text: userMessage },
              {
                inlineData: {
                  data: base64EncodedData,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
      });
  
        const response = await result.response;
        return response.text();
    } catch (error) {
      console.error("Error processing screenshot:", error);
    }
  };

function getBase64(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileBuffer = fs.readFileSync(filePath);  
      const base64EncodedData = fileBuffer.toString('base64');  
      resolve(base64EncodedData);
    } catch (error) {
      reject('Error: ', error);
    }
  });
}

module.exports = { processScreenshot };
