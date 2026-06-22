import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generate() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A professional, modern, minimalist app icon logo for an app called "AI Resume & Cover Letter Pro". The logo should incorporate elements related to career growth, documents, and AI (like a spark, a document, or an upward arrow). Clean vector style, flat colors, dark indigo and vibrant purple accents on a clean white background. No text in the logo mark itself, just the icon.',
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        fs.writeFileSync('./public/logo.png', Buffer.from(base64Data, 'base64'));
        console.log('Logo saved to public/logo.png');
        break;
      }
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

generate();
