const h = React.createElement;
const { useEffect, useMemo, useRef, useState } = React;
const { createRoot } = ReactDOM;

const CHAT_STORAGE_KEY = 'spotease_chat_messages_v1';

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
    endpoint: getDefaultEndpoint(),
    maxMessages: 12,
    ...runtime,
  };
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

function escapeText(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function MessageBubble({ role, content }) {
  return h(
    'article',
    { className: `ai-chatbot-message ${role === 'assistant' ? 'is-assistant' : 'is-user'}` },
    h('p', { dangerouslySetInnerHTML: { __html: escapeText(content) } })
  );
}

function AiChatbot() {
  const config = useMemo(() => getConfig(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [inputValue, setInputValue] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    document.body.classList.toggle('ai-chatbot-open', isOpen);
    return () => document.body.classList.remove('ai-chatbot-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  async function requestReply(nextMessages) {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: nextMessages.slice(-config.maxMessages),
        context: getPageContext(),
      }),
    });

    const payload = await response.json().catch(() => ({ error: 'Invalid server response' }));

    if (!response.ok) {
      throw new Error(payload?.error || 'Request failed');
    }

    if (!payload.reply || typeof payload.reply !== 'string') {
      throw new Error('No reply received from AI provider');
    }

    return payload.reply.trim();
  }

  async function sendMessage(rawText) {
    const userText = rawText.trim();
    if (!userText || isTyping) return;

    const nextMessages = [...messages, { role: 'user', content: userText }];
    setLastUserMessage(userText);
    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const reply = await requestReply(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      const detail = error && error.message ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, { role: 'assistant', content: `I could not process that request. ${detail}` }]);
    } finally {
      setIsTyping(false);
    }
  }

  return h(
    'section',
    { className: `ai-chatbot ${isOpen ? 'is-open' : ''}`, 'aria-label': 'SpotEase AI assistant' },
    h(
      'button',
      {
        type: 'button',
        className: 'ai-chatbot-toggle',
        'aria-expanded': isOpen,
        'aria-controls': 'ai-chat-panel',
        onClick: () => setIsOpen((prev) => !prev),
      },
      'Ask SpotEase AI'
    ),
    h('div', {
      className: `ai-chatbot-backdrop ${isOpen ? 'is-open' : ''}`,
      'aria-hidden': !isOpen,
      onClick: () => setIsOpen(false),
    }),
    h(
      'div',
      {
        id: 'ai-chat-panel',
        className: `ai-chatbot-panel ${isOpen ? 'is-open' : ''}`,
        'aria-hidden': !isOpen,
      },
      h(
        'div',
        { className: 'ai-chatbot-head' },
        h('strong', null, 'SpotEase Assistant'),
        h(
          'button',
          {
            type: 'button',
            className: 'ai-chatbot-close',
            'aria-label': 'Close chat',
            onClick: () => setIsOpen(false),
          },
          '×'
        )
      ),
      h(
        'div',
        { className: 'ai-chatbot-messages', 'aria-live': 'polite' },
        messages.length === 0
          ? h('div', { className: 'ai-chatbot-placeholder' }, 'Start a conversation with SpotEase Assistant.')
          : messages.map((entry, index) => h(MessageBubble, { key: `${entry.role}-${index}`, role: entry.role, content: entry.content }))
      ),
      h('div', { className: `ai-chatbot-typing ${isTyping ? 'is-visible' : ''}` }, 'Assistant is typing…'),
      h(
        'form',
        {
          className: 'ai-chatbot-form',
          onSubmit: (event) => {
            event.preventDefault();
            sendMessage(inputValue);
          },
        },
        h('label', { className: 'ai-chatbot-label', htmlFor: 'ai-chat-input' }, 'Message'),
        h('textarea', {
          id: 'ai-chat-input',
          ref: inputRef,
          className: 'ai-chatbot-input',
          rows: 2,
          maxLength: 1200,
          placeholder: 'Ask about spaces, reservations, or campus navigation',
          value: inputValue,
          onChange: (event) => setInputValue(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage(inputValue);
            }
          },
        }),
        h(
          'div',
          { className: 'ai-chatbot-actions' },
          h(
            'button',
            { type: 'submit', className: 'btn btn-primary', disabled: isTyping },
            'Send'
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'btn btn-secondary ai-chatbot-retry',
              disabled: !lastUserMessage || isTyping,
              onClick: () => sendMessage(lastUserMessage),
            },
            'Retry'
          )
        )
      ),
      h('p', { className: 'ai-chatbot-note' }, 'Your chat is stored locally in this browser.')
    )
  );
}

function mountAiChatbot() {
  let host = document.getElementById('aiChatbotRoot');
  if (!host) {
    host = document.createElement('div');
    host.id = 'aiChatbotRoot';
    document.body.appendChild(host);
  }

  createRoot(host).render(h(AiChatbot));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAiChatbot);
} else {
  mountAiChatbot();
}
