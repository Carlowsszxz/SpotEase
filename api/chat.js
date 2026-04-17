const PROVIDER = (process.env.AI_PROVIDER || 'huggingface').toLowerCase();
const MAX_INPUT_CHARS = Number(process.env.CHAT_MAX_INPUT_CHARS || 6000);
const MAX_MESSAGES = Number(process.env.CHAT_MAX_MESSAGES || 12);
const MAX_TOKENS = Number(process.env.CHAT_MAX_TOKENS || 400);
const REQUESTS_PER_WINDOW = Number(process.env.CHAT_RATE_LIMIT_REQUESTS || 25);
const RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000);
const REQUEST_TIMEOUT_MS = Number(process.env.CHAT_REQUEST_TIMEOUT_MS || 30_000);

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const HF_API_KEY = process.env.HF_API_KEY || '';
const HF_MODEL = process.env.HF_MODEL || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B:featherless';
const HF_MODEL_FALLBACKS = [
    HF_MODEL,
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B:featherless',
    'Qwen/Qwen2.5-1.5B-Instruct:featherless',
    'meta-llama/Llama-3.2-1B-Instruct:novita',
].filter((value, index, array) => typeof value === 'string' && value.length > 0 && array.indexOf(value) === index);

const CORS_ORIGIN = process.env.CHAT_CORS_ORIGIN || '*';

const SPOTEASE_KNOWLEDGE = [
    'SpotEase is a campus space visibility and reservation system for students, staff, and administrators.',
    'The home page explains that SpotEase helps users find available campus spaces faster with real-time occupancy visibility for study areas, labs, meeting rooms, and other shared resources.',
    'Use these page names when answering navigation questions: Home for the landing page, Dashboard for live occupancy, Resource List for browsing/searching resources, Map for locations, Reservation for booking, My Reservations for booking history, Profile for account details, Emergency for urgent actions, and Admin Panel for admin tools.',
    'Main user pages include Home, Login, Register, Dashboard, Map, Resource List, Reservation, My Reservations, Profile, Forgot Password, Reset Password, and Email Confirm.',
    'Admin and operational pages include Admin Panel, Analytics, Audit Logs, Sensor Readings, Access History, Emergency, Presence Roster, Navbar, and 3D Model.',
    'Dashboard shows live occupancy, people inside now, active spaces, near full, full, alerts, and recent activity.',
    'Resource List supports searching, filtering, sorting, and opening the map or reservation flow.',
    'Reservation lets users choose resource type, resource, and time, then check availability and confirm a booking.',
    'Map is used to browse campus resources and navigate to a reservation for a selected resource.',
    'Emergency page is for urgent access and actions, including opening the map.',
    'The app uses auth-protected pages for signed-in users and admin-only pages for admin roles.',
].join(' ');

const bannedPatterns = [
    /\bkill\b/i,
    /\bterror\b/i,
    /\bself-harm\b/i,
    /\bcredit card number\b/i,
    /\bssn\b/i,
    /\bmalware\b/i,
    /\bexploit\b/i,
];

const rateLimitStore = new Map();

function getCorsOrigin(req) {
    const origin = req.headers?.origin;
    if (typeof origin === 'string' && origin.length > 0) {
        return origin;
    }
    if (CORS_ORIGIN && CORS_ORIGIN !== '*') {
        return CORS_ORIGIN;
    }
    return '*';
}

function setCorsHeaders(req, res) {
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

function getClientIp(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    const current = rateLimitStore.get(ip);

    if (!current || now > current.resetAt) {
        rateLimitStore.set(ip, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }

    current.count += 1;
    return current.count > REQUESTS_PER_WINDOW;
}

function normalizeMessages(rawMessages) {
    if (!Array.isArray(rawMessages)) {
        return [];
    }

    return rawMessages
        .filter((entry) => entry && typeof entry.content === 'string' && typeof entry.role === 'string')
        .slice(-MAX_MESSAGES)
        .map((entry) => ({
            role: entry.role === 'assistant' ? 'assistant' : 'user',
            content: entry.content.trim().slice(0, MAX_INPUT_CHARS),
        }))
        .filter((entry) => entry.content.length > 0);
}

function containsBlockedContent(text) {
    return bannedPatterns.some((pattern) => pattern.test(text));
}

function buildSystemMessage(context = {}) {
    const pageTitle = typeof context.pageTitle === 'string' && context.pageTitle.trim() ? context.pageTitle.trim() : 'SpotEase';
    const pathname = typeof context.pathname === 'string' ? context.pathname : '';
    const hash = typeof context.hash === 'string' ? context.hash : '';

    return {
        role: 'system',
        content: [
            'You are SpotEase Assistant. Answer as a helpful assistant for this website, not as an independent general chatbot.',
            'Use the website facts below when answering questions about pages, features, navigation, and workflows.',
            `Current page: ${pageTitle}${pathname ? ` (${pathname}${hash || ''})` : ''}.`,
            SPOTEASE_KNOWLEDGE,
            'When the user asks where to go, prefer exact page names and short directions like "open Resource List" or "go to Reservation".',
            'If the user asks where to click, name the most relevant page or button from the SpotEase site.',
            'If you do not know an exact detail, say so briefly and suggest the most likely page to check.',
        ].join(' '),
    };
}

function tryAnswerSpotEaseFaq(text) {
    const q = String(text || '').toLowerCase();
    const answers = [
        {
            patterns: [/where.*resource list/, /find.*resource list/, /resource list/, /browse.*resource/i],
            reply: 'Open the Resource List page to browse, search, filter, and sort available resources.',
        },
        {
            patterns: [/where.*reservation/, /make.*reservation/, /book.*resource/, /reservation flow/, /reserve a resource/],
            reply: 'Open the Reservation page to choose a resource type, pick a resource, select a time, and confirm the booking.',
        },
        {
            patterns: [/where.*map/, /open map/, /campus map/, /resource map/],
            reply: 'Open the Map page to view campus locations and jump to the reservation flow for a selected resource.',
        },
        {
            patterns: [/where.*dashboard/, /live occupancy/, /occupancy/, /stats/],
            reply: 'Open the Dashboard page to see live occupancy, people inside now, active spaces, alerts, and recent activity.',
        },
        {
            patterns: [/my reservations/, /booking history/, /view reservations/],
            reply: 'Open the My Reservations page to view your bookings.',
        },
        {
            patterns: [/profile/, /account details/],
            reply: 'Open the Profile page to manage your account details.',
        },
        {
            patterns: [/emergency/, /urgent/, /panic/],
            reply: 'Open the Emergency page for urgent actions and quick access to the map.',
        },
        {
            patterns: [/admin panel/, /admin tools/, /analytics/, /audit logs/, /sensor readings/, /access history/],
            reply: 'Admin tools are on the Admin Panel, with related pages for Analytics, Audit Logs, Sensor Readings, Access History, and Presence Roster.',
        },
        {
            patterns: [/what can this site do/, /what does spotease do/, /about spotease/, /spotease/],
            reply: 'SpotEase helps users find available campus spaces, check live occupancy, and make reservations, with admin pages for analytics and monitoring.',
        },
    ];

    for (const entry of answers) {
        if (entry.patterns.some((pattern) => pattern.test(q))) {
            return entry.reply;
        }
    }

    return null;
}

async function callOllama(messages) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                stream: false,
                options: {
                    num_predict: MAX_TOKENS,
                    temperature: 0.6,
                },
                messages,
            }),
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Ollama request failed (${response.status}): ${details}`);
        }

        const data = await response.json();
        const content = data?.message?.content || '';
        if (!content) {
            throw new Error('Ollama returned an empty response');
        }

        return {
            reply: content,
            provider: 'ollama',
            model: OLLAMA_MODEL,
        };
    } finally {
        clearTimeout(timer);
    }
}

function isModelNotSupportedError(errorText) {
    return /model_not_supported|not supported by any provider/i.test(errorText);
}

async function callHuggingFaceModel(modelName, messages) {
    if (!HF_API_KEY) {
        throw new Error('HF_API_KEY is missing');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: modelName,
                messages,
                max_tokens: MAX_TOKENS,
                temperature: 0.6,
                stream: false,
            }),
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Hugging Face request failed (${response.status}): ${details}`);
        }

        const data = await response.json();
        const generated = data?.choices?.[0]?.message?.content || '';
        if (!generated || typeof generated !== 'string') {
            throw new Error('Hugging Face returned no text');
        }

        return {
            reply: generated.trim(),
            provider: 'huggingface',
            model: modelName,
        };
    } finally {
        clearTimeout(timer);
    }
}

async function resolveProvider(messages) {
    if (PROVIDER === 'ollama') {
        return callOllama(messages);
    }

    if (PROVIDER === 'huggingface') {
        let lastError = null;

        for (const modelName of HF_MODEL_FALLBACKS) {
            try {
                return await callHuggingFaceModel(modelName, messages);
            } catch (error) {
                lastError = error;
                const errorText = error && error.message ? error.message : '';
                if (!isModelNotSupportedError(errorText)) {
                    break;
                }
            }
        }

        throw lastError || new Error('Hugging Face request failed');
    }

    if (PROVIDER === 'auto') {
        try {
            let lastError = null;

            for (const modelName of HF_MODEL_FALLBACKS) {
                try {
                    return await callHuggingFaceModel(modelName, messages);
                } catch (error) {
                    lastError = error;
                    const errorText = error && error.message ? error.message : '';
                    if (!isModelNotSupportedError(errorText)) {
                        break;
                    }
                }
            }

            throw lastError || new Error('Hugging Face request failed');
        } catch {
            return callOllama(messages);
        }
    }

    throw new Error('Unsupported AI_PROVIDER value. Use auto, ollama, or huggingface.');
}

function getRequestBody(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    if (typeof req.body === 'string' && req.body.trim()) {
        return JSON.parse(req.body);
    }

    return {};
}

module.exports = async function handler(req, res) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        res.status(200).json({
            ok: true,
            provider: PROVIDER,
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
        return;
    }

    try {
        const body = getRequestBody(req);
        const messages = normalizeMessages(body.messages);
        const context = body && typeof body.context === 'object' && body.context ? body.context : {};

        if (messages.length === 0) {
            res.status(400).json({ error: 'At least one user message is required.' });
            return;
        }

        const latestText = messages[messages.length - 1].content;
        if (containsBlockedContent(latestText)) {
            res.status(400).json({ error: 'Message blocked by safety filter.' });
            return;
        }

        const faqReply = tryAnswerSpotEaseFaq(latestText);
        if (faqReply) {
            res.status(200).json({
                reply: faqReply,
                provider: 'site-faq',
                model: 'spot-ease-knowledge-base',
            });
            return;
        }

        const systemInstruction = buildSystemMessage(context);
        const result = await resolveProvider([systemInstruction, ...messages]);

        res.status(200).json({
            reply: result.reply,
            provider: result.provider,
            model: result.model,
        });
    } catch (error) {
        res.status(500).json({
            error: error && error.message ? error.message : 'Unexpected server error',
        });
    }
};
