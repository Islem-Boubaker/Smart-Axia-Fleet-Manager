import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Calls Gemini with JSON mode enabled and returns parsed result.
 * Strips markdown fences as a fallback in case Gemini ignores responseMimeType.
 *
 * @param {string} prompt
 * @returns {Promise<object>} parsed JSON object from Gemini
 */
export async function callGeminiAndParse(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from environment variables');

    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`;

    let data;
    try {
        const response = await axios.post(
            url,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    responseMimeType: 'application/json',
                },
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

    console.log('[Gemini] Raw response:', JSON.stringify(data, null, 2));

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        const finishReason = data?.candidates?.[0]?.finishReason;
        throw new Error(`Empty Gemini response — finishReason: ${finishReason ?? 'unknown'}`);
    }

    // Strip markdown fences in case Gemini ignores responseMimeType
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        console.error('[Gemini] JSON parse failed. Raw text:', clean);
        throw new Error(`Gemini returned invalid JSON: ${e.message}`);
    }
}
