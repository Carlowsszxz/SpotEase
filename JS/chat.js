import { supabase, getCurrentUser } from './supabase-auth.js';
import {
  assessChatBody,
  ensureRoomForumConversation,
  fetchChatProfile,
  fetchForumRooms,
  fetchRoomForumPosts,
  sanitizeChatBody,
  sendChatMessage,
  subscribeToChatRealtime,
} from './services/chat-data.js';

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatTime(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isLikelyUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

(async function initForumPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const profile = await fetchChatProfile(supabase, currentUser);

  const inboxStatus = document.getElementById('inboxStatus');
  const refreshBtn = document.getElementById('refreshInboxBtn');
  const roomSearchInput = document.getElementById('chatSearchInput');
  const roomList = document.getElementById('conversationList');
  const threadTitle = document.getElementById('threadTitle');
  const threadMeta = document.getElementById('threadMeta');
  const threadNotice = document.getElementById('threadNotice');
  const messageList = document.getElementById('messageList');
  const composerForm = document.getElementById('composerForm');
  const chatMessage = document.getElementById('chatMessage');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const composerSafety = document.getElementById('composerSafety');
  let composerReplyContext = document.getElementById('composerReplyContext');

  if (!composerReplyContext && composerForm && chatMessage) {
    composerReplyContext = document.createElement('div');
    composerReplyContext.id = 'composerReplyContext';
    composerReplyContext.className = 'composer-reply-context';
    composerReplyContext.style.display = 'none';
    composerForm.insertBefore(composerReplyContext, chatMessage);
  }

  const state = {
    rooms: [],
    roomFilter: '',
    activeRoom: null,
    activeConversation: null,
    messages: [],
    usersById: {},
    realtimeChannel: null,
    isLoading: false,
    replyTarget: null,
  };

  function setStatus(text, isError = false) {
    if (!inboxStatus) return;
    inboxStatus.textContent = text;
    inboxStatus.classList.toggle('is-error', !!isError);
  }

  function setSafety(text, kind = 'ok') {
    if (!composerSafety) return;
    composerSafety.textContent = text || '';
    composerSafety.classList.remove('is-ok', 'is-warning', 'is-error');
    if (text) composerSafety.classList.add(`is-${kind}`);
  }

  function getRoomLabel(room) {
    if (!room) return 'Room';
    const name = String(room.name || '').trim();
    const location = String(room.location || '').trim();
    return location ? `${name} · ${location}` : name;
  }

  function filterRooms(list) {
    const q = String(state.roomFilter || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((room) => {
      const haystack = `${room.name || ''} ${room.location || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  function resolveSenderName(message, isYou) {
    const sender = state.usersById[message.sender_id] || null;
    const metadata = message && message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
    const senderNameFromMeta = String(metadata.sender_name || metadata.senderName || metadata.display_name || '').trim();
    const senderEmailFromMeta = String(metadata.sender_email || metadata.senderEmail || '').trim();
    const senderNameFromDirectory = sender
      ? String(sender.name || sender.email || '').trim()
      : '';
    const senderNameCandidate = senderNameFromDirectory || senderNameFromMeta || senderEmailFromMeta;
    const senderName = sender
      ? (isLikelyUuid(senderNameCandidate) ? '' : senderNameCandidate)
      : (isYou
        ? 'You'
        : (isLikelyUuid(senderNameCandidate) ? '' : senderNameCandidate));

    return senderName || 'Community member';
  }

  function clearReplyTarget(options = {}) {
    state.replyTarget = null;
    renderReplyTarget();
    if (!options.silent) setSafety('Reply cleared', 'ok');
  }

  function setReplyTarget(message, senderName) {
    const targetName = String(senderName || '').trim() || 'Community member';
    const bodyPreview = String(message && message.body ? message.body : '').trim().slice(0, 140);

    state.replyTarget = {
      messageId: message && message.id ? String(message.id) : '',
      senderId: message && message.sender_id ? String(message.sender_id) : '',
      senderName: targetName,
      bodyPreview,
    };

    renderReplyTarget();
    setSafety(`Replying to ${targetName}`, 'ok');

    if (chatMessage && !chatMessage.disabled) {
      const mention = `@${targetName} `;
      const current = String(chatMessage.value || '');
      if (!current.trim().toLowerCase().startsWith(mention.trim().toLowerCase())) {
        chatMessage.value = `${mention}${current}`.trimStart();
      }
      chatMessage.focus();
      const len = chatMessage.value.length;
      try {
        chatMessage.setSelectionRange(len, len);
      } catch {
      }
    }
  }

  function renderReplyTarget() {
    if (!composerReplyContext) return;

    const target = state.replyTarget;
    if (!target) {
      composerReplyContext.style.display = 'none';
      composerReplyContext.innerHTML = '';
      return;
    }

    const preview = target.bodyPreview
      ? `<span class="composer-reply-preview">${escapeHtml(target.bodyPreview)}</span>`
      : '';

    composerReplyContext.innerHTML = `
      <div class="composer-reply-meta">
        <span>Replying to <strong>${escapeHtml(target.senderName || 'Community member')}</strong></span>
        ${preview}
      </div>
      <button type="button" class="composer-reply-clear" data-action="clear-reply">Cancel</button>
    `;
    composerReplyContext.style.display = '';
  }

  function renderRoomList() {
    if (!roomList) return;
    roomList.innerHTML = '';

    const rooms = filterRooms(state.rooms);
    if (!rooms.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-notice';
      empty.textContent = state.roomFilter
        ? 'No rooms match your search.'
        : 'No rooms available right now.';
      roomList.appendChild(empty);
      return;
    }

    rooms.forEach((room) => {
      const active = state.activeRoom && state.activeRoom.id === room.id;
      const card = document.createElement('article');
      card.className = `conversation-card ${active ? 'is-active' : ''}`;
      card.innerHTML = `
        <div class="meta-line">
          <strong>${escapeHtml(room.name || 'Room')}</strong>
          <span class="conversation-badge">forum</span>
        </div>
        <small>${escapeHtml(room.location || 'No location')}</small>
      `;
      card.addEventListener('click', () => selectRoom(room));
      roomList.appendChild(card);
    });
  }

  function renderMessages() {
    if (!messageList) return;
    messageList.innerHTML = '';

    if (!state.activeRoom) {
      threadNotice.textContent = 'Choose a room to open its forum.';
      threadNotice.style.display = 'block';
      return;
    }

    if (!state.messages.length) {
      threadNotice.textContent = 'No posts yet. Be the first to share an update.';
      threadNotice.style.display = 'block';
      return;
    }

    threadNotice.style.display = 'none';

    state.messages.forEach((message) => {
      const isYou = message.sender_id === profile.id;
      const metadata = message && message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
      const senderName = resolveSenderName(message, isYou);
      const replyToName = String(metadata.reply_to_sender_name || metadata.replyToSenderName || '').trim();
      const replyToBody = String(metadata.reply_to_body || metadata.replyToBody || '').trim();
      const hasReplyContext = !!(replyToName || replyToBody);
      const bubble = document.createElement('article');
      bubble.className = `message-bubble ${isYou ? 'is-you' : ''}`;
      bubble.innerHTML = `
        <div class="message-head">
          <strong>${escapeHtml(senderName)}</strong>
          <span class="message-meta">${escapeHtml(formatRelative(message.created_at))}</span>
        </div>
        ${hasReplyContext ? `
        <div class="message-reply-context">
          <span class="message-reply-target">Reply to ${escapeHtml(replyToName || 'user')}</span>
          ${replyToBody ? `<span class="message-reply-body">${escapeHtml(replyToBody)}</span>` : ''}
        </div>
        ` : ''}
        <p>${escapeHtml(message.body || '')}</p>
        <div class="message-footer">
          <span class="message-meta">${escapeHtml(formatTime(message.created_at))}</span>
          <button type="button" class="message-reply-btn">Reply</button>
        </div>
      `;

      const replyBtn = bubble.querySelector('.message-reply-btn');
      if (replyBtn) {
        replyBtn.addEventListener('click', () => {
          setReplyTarget(message, senderName);
        });
      }

      messageList.appendChild(bubble);
    });

    messageList.scrollTop = messageList.scrollHeight;
  }

  function updateComposer() {
    const ready = !!(state.activeRoom && state.activeConversation && state.activeConversation.id);
    if (chatMessage) {
      chatMessage.disabled = !ready;
      chatMessage.placeholder = ready
        ? `Post an update for ${state.activeRoom.name}...`
        : 'Select a room to start posting.';
    }
    if (sendMessageBtn) sendMessageBtn.disabled = !ready;
  }

  async function loadPostsForActiveRoom() {
    if (!state.activeConversation || !state.activeConversation.id) return;
    const data = await fetchRoomForumPosts(supabase, state.activeConversation.id, 250);
    state.messages = data.messages || [];
    state.usersById = data.usersById || {};
    renderMessages();
  }

  async function selectRoom(room) {
    if (!room) return;
    state.activeRoom = room;
    clearReplyTarget({ silent: true });
    renderRoomList();

    try {
      setStatus('Opening room forum…');
      state.activeConversation = await ensureRoomForumConversation(supabase, {
        roomId: String(room.id),
        roomName: room.name || 'Room',
        userId: profile.id,
      });

      threadTitle.textContent = `${room.name || 'Room'} Forum`;
      threadMeta.textContent = room.location
        ? `${room.location} · Public room posts`
        : 'Public room posts';

      await loadPostsForActiveRoom();
      updateComposer();
      setStatus(`Ready · ${state.rooms.length} room${state.rooms.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Failed to open room forum', error);
      setStatus('Room forum unavailable', true);
    }
  }

  async function refreshRooms() {
    if (state.isLoading) return;
    state.isLoading = true;

    try {
      setStatus('Refreshing rooms…');
      state.rooms = await fetchForumRooms(supabase, 200);
      renderRoomList();

      if (!state.activeRoom && state.rooms.length) {
        await selectRoom(state.rooms[0]);
      } else if (state.activeRoom) {
        const found = state.rooms.find((room) => room.id === state.activeRoom.id) || state.activeRoom;
        await selectRoom(found);
      }

      setStatus(`Ready · ${state.rooms.length} room${state.rooms.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Failed to load rooms', error);
      state.rooms = [];
      renderRoomList();
      state.activeRoom = null;
      state.activeConversation = null;
      state.messages = [];
      renderMessages();
      updateComposer();
      setStatus('Room list unavailable', true);
    } finally {
      state.isLoading = false;
    }
  }

  function updateSafetyState() {
    const body = sanitizeChatBody(chatMessage && chatMessage.value ? chatMessage.value : '');
    const assessment = assessChatBody(body);
    if (!assessment.ok) {
      setSafety(assessment.reason, 'warning');
      return false;
    }
    setSafety('Ready to post', 'ok');
    return true;
  }

  async function submitPost(event) {
    event.preventDefault();
    if (!state.activeConversation || !state.activeConversation.id) return;

    const body = sanitizeChatBody(chatMessage && chatMessage.value ? chatMessage.value : '');
    if (!body) {
      setSafety('Write something before posting.', 'warning');
      return;
    }

    if (!updateSafetyState()) return;

    try {
      sendMessageBtn.disabled = true;
      await sendChatMessage(supabase, {
        conversationId: state.activeConversation.id,
        senderId: profile.id,
        body,
        metadata: {
          source: 'room_forum',
          room_id: String(state.activeRoom.id),
          room_name: String(state.activeRoom.name || ''),
          page: 'FrameChat',
          sender_name: String(profile.name || profile.email || profile.id || '').trim(),
          sender_email: String(profile.email || '').trim(),
          ...(state.replyTarget ? {
            reply_to_message_id: String(state.replyTarget.messageId || '').trim(),
            reply_to_sender_id: String(state.replyTarget.senderId || '').trim(),
            reply_to_sender_name: String(state.replyTarget.senderName || '').trim(),
            reply_to_body: String(state.replyTarget.bodyPreview || '').trim(),
          } : {}),
        },
      });

      chatMessage.value = '';
      clearReplyTarget({ silent: true });
      setSafety('Posted', 'ok');
      await loadPostsForActiveRoom();
    } catch (error) {
      console.error('Failed to post room update', error);
      setSafety(`Post blocked: ${error.message || error}`, 'error');
    } finally {
      updateComposer();
    }
  }

  if (refreshBtn) refreshBtn.addEventListener('click', refreshRooms);
  if (roomSearchInput) {
    roomSearchInput.addEventListener('input', (event) => {
      state.roomFilter = String(event.target && event.target.value ? event.target.value : '');
      renderRoomList();
    });
  }

  if (chatMessage) {
    chatMessage.addEventListener('input', () => {
      updateSafetyState();
    });
  }

  if (composerReplyContext) {
    composerReplyContext.addEventListener('click', (event) => {
      const trigger = event.target && event.target.closest ? event.target.closest('[data-action="clear-reply"]') : null;
      if (!trigger) return;
      clearReplyTarget();
    });
  }

  if (composerForm) composerForm.addEventListener('submit', submitPost);

  state.realtimeChannel = subscribeToChatRealtime(supabase, profile.id, () => {
    if (state.activeConversation && state.activeConversation.id) {
      loadPostsForActiveRoom().catch(() => {});
    }
  });

  await refreshRooms();
  updateComposer();
  setSafety('Select a room to start posting.', 'warning');
})();
