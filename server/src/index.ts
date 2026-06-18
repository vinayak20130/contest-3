import "dotenv/config";
import cors from "cors";
import express, { application } from "express";
import { listProjectFiles, walkProject } from "./projectFiles.js";
import type { Message, ProjectSnapshot } from "./types.js";
// Source - https://stackoverflow.com/a/45218692
// Posted by Michel, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-18, License - CC BY-SA 4.0

import * as path from "path";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const previewUrl = process.env.PROJECT_PREVIEW_URL ?? "http://localhost:5174";
const messageHistory: Message[] = [];

// update this prompt to be more efficient
const systemPrompt =
  "You are helping update the React project in the project folder.";

import { GoogleGenAI, Type } from "@google/genai";

import * as fs from "fs";
import { json } from "stream/consumers";
const folderPath: string = "../project";

const ai = new GoogleGenAI({
  apiKey: "",
});
const weatherFunctionDeclaration = {
  name: "get_files_in_directory",
  description: "Gets the current files for a given folder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "",
      },
      content: {
        type: Type.STRING,
        description: "",
      },
    },
    required: ["path", "content"],
  },
};
const summaryFunctionDeclaration = {
  name: "summary_function_declarations",
  description: "walks through the whole project and gives summary to the user",
  parameters: {
    type: Type.OBJECT,
    properties: {
      project: {
        type: Type.STRING,
        description: "",
      },
      summary: {
        type: Type.STRING,
        description: "",
      },
    },
    required: ["path", "content"],
  },
};

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/project", async (_request, response) => {
  // you'll use this endpoint to show preview of your running react project , messages  , files , only one project for now is supported.
  // make sure the above state is synced with fe, even some changes are applied
  // return ProjectSnapshot type here
  /////

  // Send request with function declarations
  const resp = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "get files int the folder",
    config: {
      tools: [
        {
          functionDeclarations: [
            weatherFunctionDeclaration,
            summaryFunctionDeclaration,
          ],
        },
      ],
    },
  });

  // Check for function calls in the response
  if (resp.functionCalls && resp.functionCalls.length > 0) {
    const functionCall = resp.functionCalls[0]; // Assuming one function call
    console.log(`Function to call: ${functionCall.name}`);
    console.log(`ID: ${functionCall.id}`);
    console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
    // In a real app, you would call your actual function here:
    const result = await listProjectFiles();
    const summary = await walkProject("../project");
    console.log(result, "result");
    return response.status(200).json({
      files: result,
      previewUrl: "http://localhost:5174/",
      summary,
      messageHistory: [],
      updatedAt: Date.now(),
    });
  } else {
    console.log("No function call found in the resp.");
    console.log(resp.text);
  }

  // console.log(interaction, "this is the interaction output");
  // 3. Handle the tool call
  // Inspect the actual structure of the response
  // console.debug(`Response: ${JSON.stringify(interaction)}`);

  //
});

app.post("/api/messages", async (request, response) => {
  const message = request.body;
  // writeProjectFile(path, content).
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
