import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Calls Groq (llama-3.3-70b-versatile) with JSON mode and returns parsed result.
 * Drop-in replacement for callGeminiAndParse — same signature and return shape.
 *
 * @param {string} prompt
 * @returns {Promise<object>} parsed JSON object
 */
export async function callGeminiAndParse(prompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is missing from environment variables');

    let data;
    try {
        const response = await axios.post(
            `${GROQ_BASE_URL}/chat/completions`,
            {
                model: GROQ_MODEL,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                timeout: 60000,
            }
        );
        data = response.data;
    } catch (err) {
        const status = err?.response?.status;
        const details = err?.response?.data
            ? JSON.stringify(err.response.data)
            : err?.message || 'Unknown Groq error';
        throw new Error(`Groq request failed${status ? ` (${status})` : ''}: ${details}`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
        const finishReason = data?.choices?.[0]?.finish_reason;
        throw new Error(`Empty Groq response — finish_reason: ${finishReason ?? 'unknown'}`);
    }

    // Strip markdown fences as safety net
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        console.error('[Groq] JSON parse failed. Raw text:', clean);
        throw new Error(`Groq returned invalid JSON: ${e.message}`);
    }
}
