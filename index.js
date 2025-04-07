// me-ai/index.js

import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { readFile } from "fs/promises";
import { OpenAI } from "openai";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

app.use(bodyParser.json());

let knowledgeCache = null;

// Load knowledge into memory once when the server starts
const loadKnowledge = async () => {
   if (!knowledgeCache) {
      console.log("Loading knowledge...");
      const general = JSON.parse(
         await readFile("./data/general.json", "utf-8")
      );
      const projects = JSON.parse(
         await readFile("./data/projects.json", "utf-8")
      );
      knowledgeCache = { general, projects };
   }
   return knowledgeCache;
};

// Prompt builder
const buildPrompt = (knowledge, userMessage) => {
   return `You are a helpful assistant who knows everything about Layton and their computer science projects.

General Info:
${JSON.stringify(knowledge.general, null, 2)}

Projects:
${JSON.stringify(knowledge.projects, null, 2)}

User: ${userMessage}
Assistant:`;
};

// Chat endpoint
app.post("/ask", async (req, res) => {
   const userMessage = req.body.message;

   if (!userMessage) return res.status(400).json({ error: "Missing message" });

   try {
      const knowledge = await loadKnowledge();
      const prompt = buildPrompt(knowledge, userMessage);

      const completion = await openai.chat.completions.create({
         messages: [{ role: "user", content: prompt }],
         model: "gpt-3.5-turbo",
      });

      const reply = completion.choices[0]?.message?.content;
      res.json({ reply });
   } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
   }
});

app.listen(port, () => {
   console.log(`API running on port ${port}`);
});
