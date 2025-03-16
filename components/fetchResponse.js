const fs = require("fs");
// const { GoogleGenerativeAI,HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const { GoogleGenerativeAI} = require("@google/generative-ai");
const path = require("path");
require("dotenv").config();
const maxLC = 2478;
const sqlite3 = require("sqlite3").verbose();
const DB_FILE = "assets/lcdb.sqlite"; // Path to SQLite database

// const safetySettings = [
//   {
//     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//     threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//     threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,

//     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//     threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//   },
// ];

const getTitleDetails = async (titleNumber) => {
  //console.log(titleNumber);
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE);

    db.get(
      "SELECT problem_title, python_solutions FROM lcdb WHERE number = ?",
      [titleNumber],
      (err, row) => {
        db.close();

        if (err) {
          console.error("Database Query Error:", err);
          reject(err);
        } else if (row) {
          resolve({
            python_solutions: row.python_solutions,
          });
        } else {
          //console.log("No match found in database.");
          resolve(null); // No matching problem
        }
      }
    );
  });
};
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Setup the generative model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Function to process the screenshot
const processScreenshot = async (filePath, num, win) => {
  //Leetcode RAG?
  //Algo would be: get title number from the screenshot, search title in the csv database, return the code, generate PROBLEM STATEMENT, THOUGHTS and COMPLEXITY based on the returned code.
  //In this method, I can be absolutely certain that the solution will be optimal and that it works.
  if (num == 2) {
    try {
      const base64EncodedData = await getBase64(filePath);
      const mimeType = "image/png";

      //get title of the problem: Basically using Gemini as an OCR recognition tool first.
      //Then will send it back along with the fetched leetcode from the database to provide the whole thing.
      //  This is 2 step process so it'll take time.
      const userMessage = `whats the problem number of this leetcode problem? Its in the title. Only provide the number, nothing else. Also, whats the problem statement, what's being asked of me here? Write in a detailed way, to help me understand. Write your response in the format:\
        PROBLEM NUMBER:[number], PROBLEM STATEMENT:[problem statement]`;
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

      const response = await result.response.text();
      // Define a regular expression to capture the number and statement
      const regex = /PROBLEM NUMBER:\s*(\d+),\s*PROBLEM STATEMENT:\s*(.+)/;
      const matches = response.match(regex);
      if (matches) {
        // Extract the problem number and statement from the regex groups
        const titleNumber = parseInt(matches[1].replace(/\D/g, ""), 10); // e.g., "123"
        const problemStatement = matches[2]; // e.g., "Given an array of integers, find the maximum subarray sum."

        // Log the results or use them as needed
        //console.log("Problem Number:", titleNumber);
        //console.log("Problem Statement:", problemStatement);


        //max number in dataset is 2,478 , and leetcode premium questions are missing :(
        //ok first i check if title num<2478 OR not present in dataset then if its present in lcdb.csv
        // Check if title number is in lcdb.csv
        const problemDetails = await getTitleDetails(titleNumber);
        if (!problemDetails || titleNumber > maxLC) {
          //output not prosent in ds
          //console.log("Not present in dataset, trying ai gen");
          await win.webContents.executeJavaScript(`
            document.getElementById("loadingspan").textContent = ("No Leetcode match found, trying AI Gen");
          `);
          return await getResponse(filePath);
        } else {
          //console.log("Match found in database");
          await win.webContents.executeJavaScript(`
            document.getElementById("loadingspan").textContent = ("Leetcode match found in database!");
          `);
          const { python_solutions } = problemDetails;
          //console.log(problem_title,python_solutions);
          //now, send this over to gemini again, get output
          return await getLeetcodeResponse(
            filePath,
            titleNumber,
            python_solutions,
            problemStatement
          );

          //return { titleNumber, problem_title, python_solution };
        }
      } else {
        console.error("Response does not match the expected format.");
      }

      //console.log(response);
      // return response.text();
    } catch (error) {
      console.error("Error processing screenshot:", error);
    }
  } else {
    try {
      return await getResponse(filePath);
    } catch (error) {
      console.error("Error processing screenshot:", error);
      // await win.webContents.executeJavaScript(`
      //   document.getElementById("loadingspan").textContent =  ${JSON.stringify(error.message)};
      // `);
    }
  }
};

async function getLeetcodeResponse(filePath,titleNumber,python_solutions,problemStatement) {
  const userMessage = `You are roleplaying as a software developer, focused on solving DSA and leetcode problems. \
  You are already given the following solved code for this problem, DO NOT MODIFY THE CODE! this is very important. However, in a case if the code is unnecessarily convoluted and can be reduced, simplify it but keep the logic intact \
  ${problemStatement}\n\
  ${python_solutions}\n\
}
  Explain with the help of the provided code and statement, write 'my thoughts' in THOUGHTS section, as I would explain the code to the interviewer step by step. Start with what "DSA topic" this question belongs to. Keep it short and to the point. Use bullet points,  Add newline character after each point.\
  The SUMMARY field should have the summary of the problem, telling user in short what's the objective. Dont write too much, get to the point so that the user understands the problem just by looking at this.
  Write Complexity (time, space) in two bullet points. Short, to the point.\
  The format of your response should be strictly like this, including headers:
  SUMMARY,
  THOUGHTS,
  CODE,
  COMPLEXITY
  `;

  // const model = genAI.getGenerativeModel({
  //   // model: "tunedModels/lc-jerg7hd7wupg", //my finetuned leetcode model
  //   // ,safetySettings: safetySettings
  // });
  
  const result = await model.generateContent({
      contents: [
        {
          parts: [
            { text: userMessage }
          ]
        }
      ]
    });

  const response = await result.response;
  // console.log(response.text());
  return response.text();
}

async function getResponse(filePath) {
  const base64EncodedData = await getBase64(filePath);
  const mimeType = "image/png";

  const userMessage = `You are roleplaying as a software developer, focused on solving DSA and leetcode problems. \
You need to solve the problem provided in this image with least amount of code possible, while maintaining code verbosity and explaining the segments separately as you go. \
Explain in simple language, write 'my thoughts' in THOUGHTS section to explain it as me to the interviewer, like first ill do this, then that, and so on. First, write what DSA topic this question belongs to. Use bullet points,  Add newline character after each point. Keep this very short. Dont write a paragraph, explain in bullet points followed by '\n' \
The SUMMARY field should have the problem statement, telling user very briefly in very short sentence, what's being asked in the question/whats the objective. Dont write too much, get to the point so that the user understands the problem just by looking at this.
Now, this is important, to provide the optimal code, search the problem statement and the problem title over the internet, fetch the most popular user submission, and then use that to provide me with a solution. It should not exceed Time limit, assume test cases can get very large in the end. \
Your only task is to make sure the code runs on first attempt, and that it should not look ai generated. Add very short comments on each line telling what it does. \
It should look as if written by a human, by me. Keep explanations short and to the point. Complexity details should be short.\
The format of your response should be strictly like this, including headers:
SUMMARY,
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
  // console.log(response.text());
  return response.text();
}

function getBase64(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64EncodedData = fileBuffer.toString("base64");
      resolve(base64EncodedData);
    } catch (error) {
      reject("Error: ", error);
    }
  });
}

module.exports = { processScreenshot };
