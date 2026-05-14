import React, { useEffect, useMemo, useRef, useState } from 'react';

const CHAT_STORAGE_KEY = 'spotease_chat_messages_v1';
const CHATBOT_TRIGGER_SELECTOR = '[data-ai-chatbot-trigger]';

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

function Bubble({ role, content }) {
  return (
    <article className={`ai-chatbot-message ${role === 'assistant' ? 'is-assistant' : 'is-user'}`}>
      <p dangerouslySetInnerHTML={{ __html: escapeText(content) }} />
    </article>
  );
}

export default function AiChatbot() {
  const config = useMemo(() => getConfig(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [hasExternalTrigger, setHasExternalTrigger] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [inputValue, setInputValue] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const syncExternalTriggers = () => {
      const triggers = Array.from(document.querySelectorAll(CHATBOT_TRIGGER_SELECTOR));
      setHasExternalTrigger(triggers.length > 0);

      triggers.forEach((trigger) => {
        trigger.setAttribute('aria-controls', 'ai-chat-panel');
        trigger.setAttribute('aria-expanded', String(isOpen));
      });
    };

    const onExternalTriggerClick = (event) => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      const trigger = target.closest(CHATBOT_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      setIsOpen((prev) => !prev);
    };

    syncExternalTriggers();
    const observer = new MutationObserver(syncExternalTriggers);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', onExternalTriggerClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onExternalTriggerClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    document.body.classList.toggle('ai-chatbot-open', isOpen);
    if (isOpen) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
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

    setLastUserMessage(userText);
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsTyping(true);

    const nextMessages = [...messages, { role: 'user', content: userText }];

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

  return (
    <section className={`ai-chatbot ${isOpen ? 'is-open' : ''}`} aria-label="SpotEase AI assistant">
      {!hasExternalTrigger ? (
        <button
          type="button"
          className="ai-chatbot-toggle"
          aria-expanded={isOpen}
          aria-controls="ai-chat-panel"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Ask SpotEase AI
        </button>
      ) : null}

      <div className={`ai-chatbot-backdrop ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(false)} aria-hidden={!isOpen} />

      <div
        id="ai-chat-panel"
        ref={panelRef}
        className={`ai-chatbot-panel ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="ai-chatbot-head">
          <strong>SpotEase Assistant</strong>
          <button type="button" className="ai-chatbot-close" aria-label="Close chat" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </div>

        <div className="ai-chatbot-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="ai-chatbot-placeholder">Start a conversation with SpotEase Assistant.</div>
          ) : (
            messages.map((entry, index) => <Bubble key={`${entry.role}-${index}`} role={entry.role} content={entry.content} />)
          )}
        </div>

        <div className={`ai-chatbot-typing ${isTyping ? 'is-visible' : ''}`}>Assistant is typing…</div>

        <form
          className="ai-chatbot-form"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(inputValue);
          }}
        >
          <label className="ai-chatbot-label" htmlFor="ai-chat-input">
            Message
          </label>
          <textarea
            id="ai-chat-input"
            ref={inputRef}
            className="ai-chatbot-input"
            rows="2"
            maxLength={1200}
            placeholder="Ask about spaces, reservations, or campus navigation"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(inputValue);
              }
            }}
          />
          <div className="ai-chatbot-actions">
            <button type="submit" className="btn btn-primary" disabled={isTyping}>
              Send
            </button>
            <button
              type="button"
              className="btn btn-secondary ai-chatbot-retry"
              disabled={!lastUserMessage || isTyping}
              onClick={() => sendMessage(lastUserMessage)}
            >
              Retry
            </button>
          </div>
        </form>

        <p className="ai-chatbot-note">Your chat is stored locally in this browser.</p>
      </div>
    </section>
  );
}
