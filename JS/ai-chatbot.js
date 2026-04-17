const CHAT_STORAGE_KEY = 'spotease_chat_messages_v1';

const defaultConfig = {
    endpoint: getDefaultEndpoint(),
    maxMessages: 12,
};

function getDefaultEndpoint() {
    const { hostname, protocol } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
        return 'http://localhost:8787/api/chat';
    }

    return '/api/chat';
}

function getPageContext() {
    const { pathname, href, hash } = window.location;
    return {
        pageTitle: document.title || 'SpotEase',
        pathname,
        href,
        hash,
    };
}

function getConfig() {
    const runtime = window.SPOTEASE_CHAT_CONFIG || {};
    return {
        ...defaultConfig,
        ...runtime,
    };
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function loadMessages() {
    try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((entry) => entry && typeof entry.role === 'string' && typeof entry.content === 'string');
    } catch {
        return [];
    }
}

function saveMessages(messages) {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
}

function createWidgetMarkup() {
    const host = document.createElement('section');
    host.className = 'ai-chatbot';
    host.innerHTML = `
        <button type="button" class="ai-chatbot-toggle" aria-expanded="false" aria-controls="ai-chat-panel">
            Ask SpotEase AI
        </button>
        <div class="ai-chatbot-backdrop" hidden></div>
        <div class="ai-chatbot-panel" id="ai-chat-panel" hidden>
            <div class="ai-chatbot-head">
                <strong>SpotEase Assistant</strong>
                <button type="button" class="ai-chatbot-close" aria-label="Close chat">×</button>
            </div>
            <div class="ai-chatbot-messages" aria-live="polite"></div>
            <div class="ai-chatbot-typing" hidden>Assistant is typing…</div>
            <form class="ai-chatbot-form">
                <label class="ai-chatbot-label" for="ai-chat-input">Message</label>
                <textarea id="ai-chat-input" class="ai-chatbot-input" rows="2" maxlength="1200" placeholder="Ask about spaces, reservations, or campus navigation"></textarea>
                <div class="ai-chatbot-actions">
                    <button type="submit" class="btn btn-primary">Send</button>
                    <button type="button" class="btn btn-secondary ai-chatbot-retry" disabled>Retry</button>
                </div>
            </form>
            <p class="ai-chatbot-note">Your chat is stored locally in this browser.</p>
        </div>
    `;

    return host;
}

function renderMessages(messagesContainer, messages) {
    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'ai-chatbot-placeholder';
        placeholder.textContent = 'Start a conversation with SpotEase Assistant.';
        messagesContainer.appendChild(placeholder);
        return;
    }

    messages.forEach((entry) => {
        const item = document.createElement('article');
        item.className = `ai-chatbot-message ${entry.role === 'assistant' ? 'is-assistant' : 'is-user'}`;
        item.innerHTML = `<p>${escapeHtml(entry.content)}</p>`;
        messagesContainer.appendChild(item);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function requestReply(config, messages) {
    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: messages.slice(-config.maxMessages),
            context: getPageContext(),
        }),
    });

    const payload = await response.json().catch(() => ({ error: 'Invalid server response' }));

    if (!response.ok) {
        const errorText = payload && payload.error ? payload.error : 'Request failed';
        throw new Error(errorText);
    }

    if (!payload.reply || typeof payload.reply !== 'string') {
        throw new Error('No reply received from AI provider');
    }

    return payload.reply.trim();
}

function initAiChatbot() {
    const config = getConfig();
    const widget = createWidgetMarkup();
    document.body.appendChild(widget);

    const backdrop = widget.querySelector('.ai-chatbot-backdrop');
    const panel = widget.querySelector('.ai-chatbot-panel');
    const toggle = widget.querySelector('.ai-chatbot-toggle');
    const close = widget.querySelector('.ai-chatbot-close');
    const form = widget.querySelector('.ai-chatbot-form');
    const input = widget.querySelector('.ai-chatbot-input');
    const messagesContainer = widget.querySelector('.ai-chatbot-messages');
    const typingState = widget.querySelector('.ai-chatbot-typing');
    const retryButton = widget.querySelector('.ai-chatbot-retry');

    const state = {
        isOpen: false,
        isLoading: false,
        messages: loadMessages(),
        lastUserMessage: null,
    };

    function setOpen(nextOpen) {
        state.isOpen = nextOpen;
        backdrop.hidden = !nextOpen;
        panel.hidden = !nextOpen;
        toggle.setAttribute('aria-expanded', String(nextOpen));
        document.body.classList.toggle('ai-chatbot-open', nextOpen);
        if (nextOpen) {
            input.focus();
        }
    }

    function setLoading(nextLoading) {
        state.isLoading = nextLoading;
        typingState.hidden = !nextLoading;
        form.querySelector('button[type="submit"]').disabled = nextLoading;
        input.disabled = nextLoading;
    }

    function addMessage(role, content) {
        state.messages.push({ role, content });
        saveMessages(state.messages);
        renderMessages(messagesContainer, state.messages);
    }

    async function sendMessage(rawText) {
        const userText = rawText.trim();
        if (!userText) return;

        state.lastUserMessage = userText;
        retryButton.disabled = true;
        addMessage('user', userText);
        input.value = '';
        setLoading(true);

        try {
            const reply = await requestReply(config, state.messages);
            addMessage('assistant', reply);
        } catch (error) {
            const detail = error && error.message ? error.message : 'Unknown error';
            addMessage('assistant', `I could not process that request. ${detail}`);
            retryButton.disabled = false;
        } finally {
            setLoading(false);
        }
    }

    toggle.addEventListener('click', () => setOpen(!state.isOpen));
    close.addEventListener('click', () => setOpen(false));
    backdrop.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.isOpen) {
            setOpen(false);
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage(input.value);
        }
    });

    retryButton.addEventListener('click', () => {
        if (!state.lastUserMessage || state.isLoading) return;
        sendMessage(state.lastUserMessage);
    });

    renderMessages(messagesContainer, state.messages);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiChatbot);
} else {
    initAiChatbot();
}
