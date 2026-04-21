import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// import ollama, { Ollama } from 'ollama';
// export const AI_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
// const client = process.env.OLLAMA_URL
//     ? new Ollama({ host: process.env.OLLAMA_URL })
//     : ollama;
// export const runAgents = async (prompt) => {
//     return client.generate({
//         model: AI_MODEL,
//         prompt,
//         stream: false,
//     });
// };

export const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load fleet-backend/.env even when server is started from a different cwd.
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

export const runAgents = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing in environment variables');
    }

    const url = `${GEMINI_BASE_URL}/models/${AI_MODEL}:generateContent`;

    let data;

    try {
        const response = await axios.post(
            url,
            {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey,
                },
                timeout: 60000,
            }
        );

        data = response.data;
    } catch (err) {
        const status = err?.response?.status;
        const details = err?.response?.data
            ? JSON.stringify(err.response.data)
            : err?.message || 'Unknown Gemini error';
        throw new Error(`Gemini request failed${status ? ` (${status})` : ''}: ${details}`);
    }

    const response = (data?.candidates || [])
        .flatMap((candidate) => candidate?.content?.parts || [])
        .map((part) => part?.text || '')
        .join('\n')
        .trim();

    return { response };
};
