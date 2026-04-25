const CHAT_STORAGE_KEY = 'spotease_chat_state_v1';

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'chat-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeText(value, maxLength = 2000) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeMultiline(value, maxLength = 2000) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function emptyLocalState() {
  return {
    users: [],
    conversations: [],
    participants: [],
    messages: [],
    blocks: [],
    reports: [],
  };
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return emptyLocalState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyLocalState();
    return {
      ...emptyLocalState(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    };
  } catch {
    return emptyLocalState();
  }
}

function saveLocalState(state) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function isMissingChatTableError(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  return (
    message.includes('relation') && message.includes('does not exist')
  ) || message.includes('table') && message.includes('does not exist') || message.includes('permission denied') || message.includes('row-level security');
}

function isRecoverableChatBackendError(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  const code = String(error && error.code ? error.code : '').toUpperCase();
  const status = Number(error && (error.status || error.statusCode || 0));

  if (isMissingChatTableError(error)) return true;
  if (status >= 500) return true;
  if (code === '42P17') return true;
  if (message.includes('infinite recursion') || message.includes('stack depth')) return true;
  if (message.includes('failed to load') || message.includes('internal server error')) return true;
  return false;
}

function isMissingFunctionError(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  const code = String(error && error.code ? error.code : '').toUpperCase();
  return code === 'PGRST202' || message.includes('could not find the function') || message.includes('function') && message.includes('does not exist');
}

function seedLocalStateForUser(currentUser) {
  const state = loadLocalState();
  const userId = currentUser && currentUser.id ? currentUser.id : 'local-user';
  const userName = normalizeText((currentUser && (currentUser.name || currentUser.email)) || 'You', 80) || 'You';
  const userEmail = normalizeText((currentUser && currentUser.email) || 'you@example.com', 120) || 'you@example.com';

  const hasUser = state.users.some((u) => u.id === userId);
  if (!hasUser) {
    state.users.push({ id: userId, name: userName, email: userEmail });
  }

  const supportUserId = 'local-support-user';
  const studyUserId = 'local-study-user';
  if (!state.users.some((u) => u.id === supportUserId)) {
    state.users.push({ id: supportUserId, name: 'Campus Support', email: 'support@spotease.local' });
  }
  if (!state.users.some((u) => u.id === studyUserId)) {
    state.users.push({ id: studyUserId, name: 'Study Group', email: 'study-group@spotease.local' });
  }

  if (state.conversations.length === 0) {
    const directId = randomId();
    const groupId = randomId();
    const createdAt = nowIso();

    state.conversations.push(
      {
        id: directId,
        title: 'Campus Support',
        is_group: false,
        created_by: supportUserId,
        created_at: createdAt,
        updated_at: createdAt,
        metadata: { local: true },
      },
      {
        id: groupId,
        title: 'Campus Study Group',
        is_group: true,
        created_by: studyUserId,
        created_at: createdAt,
        updated_at: createdAt,
        metadata: { local: true },
      }
    );

    state.participants.push(
      { conversation_id: directId, user_id: userId, role: 'member', joined_at: createdAt, last_read_at: createdAt, muted_until: null, blocked_at: null },
      { conversation_id: directId, user_id: supportUserId, role: 'owner', joined_at: createdAt, last_read_at: createdAt, muted_until: null, blocked_at: null },
      { conversation_id: groupId, user_id: userId, role: 'member', joined_at: createdAt, last_read_at: createdAt, muted_until: null, blocked_at: null },
      { conversation_id: groupId, user_id: supportUserId, role: 'member', joined_at: createdAt, last_read_at: createdAt, muted_until: null, blocked_at: null },
      { conversation_id: groupId, user_id: studyUserId, role: 'owner', joined_at: createdAt, last_read_at: createdAt, muted_until: null, blocked_at: null }
    );

    const messages = [
      {
        id: randomId(),
        conversation_id: directId,
        sender_id: supportUserId,
        body: 'This fallback chat is active until the database tables are ready.',
        created_at: createdAt,
        updated_at: createdAt,
        edited_at: null,
        deleted_at: null,
        metadata: { local: true },
      },
      {
        id: randomId(),
        conversation_id: groupId,
        sender_id: studyUserId,
        body: 'Check the dashboard for live occupancy before heading to a room.',
        created_at: createdAt,
        updated_at: createdAt,
        edited_at: null,
        deleted_at: null,
        metadata: { local: true },
      },
    ];
    state.messages.push(...messages);
  }

  saveLocalState(state);
  return state;
}

function getUserLabel(user) {
  if (!user) return 'Unknown user';
  return normalizeText(user.name || user.email || 'Unknown user', 80) || 'Unknown user';
}

function listConversationParticipants(state, conversationId) {
  const participantRows = (state.participants || []).filter((row) => row.conversation_id === conversationId && !row.blocked_at);
  return participantRows.map((row) => {
    const user = (state.users || []).find((u) => u.id === row.user_id) || { id: row.user_id, name: row.user_id, email: '' };
    return {
      id: row.user_id,
      role: row.role || 'member',
      joined_at: row.joined_at || null,
      last_read_at: row.last_read_at || null,
      muted_until: row.muted_until || null,
      blocked_at: row.blocked_at || null,
      name: user.name || user.email || row.user_id,
      email: user.email || null,
    };
  });
}

function computeUnreadCount(messages, lastReadAt, currentUserId) {
  const lastReadMs = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter((message) => {
    if (!message || message.sender_id === currentUserId) return false;
    return new Date(message.created_at || 0).getTime() > lastReadMs;
  }).length;
}

function getLatestMessage(messages) {
  return (messages || []).slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0] || null;
}

function attachLatestMessage(conversation, messages, currentUserId, state) {
  const latestMessage = getLatestMessage(messages);
  const participant = (state.participants || []).find((row) => row.conversation_id === conversation.id && row.user_id === currentUserId);
  const unreadCount = participant ? computeUnreadCount(messages, participant.last_read_at, currentUserId) : 0;
  const participantUsers = listConversationParticipants(state, conversation.id);

  return {
    ...conversation,
    participants: participantUsers,
    latest_message: latestMessage,
    unread_count: unreadCount,
  };
}

async function queryCurrentUserProfile(supabase, userId, fallbackUser) {
  if (!supabase || !userId) {
    return {
      id: userId || 'local-user',
      name: getUserLabel(fallbackUser),
      email: fallbackUser && fallbackUser.email ? fallbackUser.email : null,
    };
  }

  try {
    const { data, error } = await supabase.from('users').select('id,name,email').eq('id', userId).maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    // ignore and fall back to auth data
  }

  return {
    id: userId,
    name: getUserLabel(fallbackUser),
    email: fallbackUser && fallbackUser.email ? fallbackUser.email : null,
  };
}

export function sanitizeChatBody(body) {
  const text = normalizeMultiline(body, 2000);
  if (!text) return '';
  const repeated = /(.)\1{11,}/.test(text);
  if (repeated) return '';
  return text;
}

export function assessChatBody(body) {
  const text = sanitizeChatBody(body);
  if (!text) {
    return { ok: false, reason: 'Message is empty or unsafe.' };
  }
  if (text.length > 2000) {
    return { ok: false, reason: 'Message is too long.' };
  }
  if (/https?:\/\//i.test(text) && text.length < 12) {
    return { ok: false, reason: 'Please add more context to links.' };
  }
  return { ok: true, reason: '' };
}

export async function fetchChatProfile(supabase, currentUser) {
  const userId = currentUser && currentUser.id ? currentUser.id : null;
  return queryCurrentUserProfile(supabase, userId, currentUser || null);
}

export async function searchChatUsers(supabase, queryText, currentUserId, limit = 8) {
  const query = normalizeText(queryText, 80);
  if (!query) return [];

  if (!supabase) {
    const local = seedLocalStateForUser({ id: currentUserId, name: 'You', email: 'you@example.com' });
    return local.users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        const haystack = `${user.name || ''} ${user.email || ''}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .slice(0, limit)
      .map((user) => ({ id: user.id, name: user.name || user.email, email: user.email || null }));
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email')
      .neq('id', currentUserId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    const local = seedLocalStateForUser({ id: currentUserId, name: 'You', email: 'you@example.com' });
    return local.users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        const haystack = `${user.name || ''} ${user.email || ''}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .slice(0, limit)
      .map((user) => ({ id: user.id, name: user.name || user.email, email: user.email || null }));
  }
}

export async function fetchChatInbox(supabase, currentUserId, fallbackUser = null) {
  if (!supabase) {
    const state = seedLocalStateForUser({ id: currentUserId, name: fallbackUser && fallbackUser.name, email: fallbackUser && fallbackUser.email });
    const conversations = (state.conversations || [])
      .filter((conversation) => (state.participants || []).some((row) => row.conversation_id === conversation.id && row.user_id === currentUserId && !row.blocked_at))
      .map((conversation) => {
        const messages = (state.messages || [])
          .filter((message) => message.conversation_id === conversation.id && !message.deleted_at)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return attachLatestMessage(conversation, messages, currentUserId, state);
      })
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    return { conversations, membersByConversation: {}, profile: await fetchChatProfile(null, fallbackUser) };
  }

  const profile = await fetchChatProfile(supabase, fallbackUser);

  try {
    const { data: membershipRows, error: membershipError } = await supabase
      .from('chat_conversation_participants')
      .select('conversation_id,last_read_at,blocked_at,role')
      .eq('user_id', currentUserId)
      .order('updated_at', { ascending: false });

    if (membershipError) throw membershipError;

    const conversationIds = (membershipRows || []).map((row) => row.conversation_id).filter(Boolean);
    if (conversationIds.length === 0) {
      return { conversations: [], membersByConversation: {}, profile };
    }

    const [{ data: conversations, error: conversationsError }, { data: messages, error: messagesError }, { data: participantRows, error: participantError }] = await Promise.all([
      supabase.from('chat_conversations').select('id,title,is_group,created_by,created_at,updated_at,archived_at,metadata').in('id', conversationIds),
      supabase.from('chat_messages').select('id,conversation_id,sender_id,body,body_plain,created_at,updated_at,edited_at,deleted_at,metadata').in('conversation_id', conversationIds).order('created_at', { ascending: false }).limit(500),
      supabase.from('chat_conversation_participants').select('conversation_id,user_id,role,last_read_at,muted_until,blocked_at').in('conversation_id', conversationIds),
    ]);

    if (conversationsError) throw conversationsError;
    if (messagesError) throw messagesError;
    if (participantError) throw participantError;

    const participantUserIds = Array.from(new Set((participantRows || []).map((row) => row.user_id).filter(Boolean)));
    const { data: users, error: usersError } = participantUserIds.length > 0
      ? await supabase.from('users').select('id,name,email').in('id', participantUserIds)
      : { data: [], error: null };

    if (usersError) throw usersError;

    const userMap = new Map((users || []).map((user) => [user.id, user]));
    const membersByConversation = {};
    (participantRows || []).forEach((row) => {
      if (!membersByConversation[row.conversation_id]) membersByConversation[row.conversation_id] = [];
      const user = userMap.get(row.user_id) || { id: row.user_id, name: row.user_id, email: null };
      membersByConversation[row.conversation_id].push({
        id: user.id,
        name: user.name || user.email || user.id,
        email: user.email || null,
        role: row.role || 'member',
        last_read_at: row.last_read_at || null,
        muted_until: row.muted_until || null,
        blocked_at: row.blocked_at || null,
      });
    });

    const messagesByConversation = new Map();
    (messages || []).forEach((message) => {
      if (!messagesByConversation.has(message.conversation_id)) messagesByConversation.set(message.conversation_id, []);
      messagesByConversation.get(message.conversation_id).push(message);
    });

    const membershipMap = new Map((membershipRows || []).map((row) => [row.conversation_id, row]));
    const inbox = (conversations || [])
      .map((conversation) => {
        const msgs = messagesByConversation.get(conversation.id) || [];
        const membership = membershipMap.get(conversation.id);
        return {
          ...conversation,
          participants: membersByConversation[conversation.id] || [],
          latest_message: msgs[0] || null,
          unread_count: computeUnreadCount(msgs, membership && membership.last_read_at, currentUserId),
          blocked_at: membership ? membership.blocked_at || null : null,
        };
      })
      .filter((conversation) => !conversation.archived_at)
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    return { conversations: inbox, membersByConversation, profile };
  } catch (error) {
    if (!isRecoverableChatBackendError(error)) throw error;
    return fetchChatInbox(null, currentUserId, fallbackUser);
  }
}

export async function fetchConversationThread(supabase, conversationId, currentUserId, fallbackUser = null) {
  if (!conversationId) {
    return { conversation: null, messages: [], members: [] };
  }

  if (!supabase) {
    const state = seedLocalStateForUser({ id: currentUserId, name: fallbackUser && fallbackUser.name, email: fallbackUser && fallbackUser.email });
    const conversation = (state.conversations || []).find((row) => row.id === conversationId) || null;
    if (!conversation) return { conversation: null, messages: [], members: [] };

    const messages = (state.messages || [])
      .filter((message) => message.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const members = listConversationParticipants(state, conversationId);
    return { conversation: attachLatestMessage(conversation, messages, currentUserId, state), messages, members };
  }

  const profile = await fetchChatProfile(supabase, fallbackUser);
  try {
    const [{ data: conversation, error: conversationError }, { data: participantRows, error: participantError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('chat_conversations').select('id,title,is_group,created_by,created_at,updated_at,archived_at,metadata').eq('id', conversationId).maybeSingle(),
      supabase.from('chat_conversation_participants').select('conversation_id,user_id,role,last_read_at,muted_until,blocked_at').eq('conversation_id', conversationId),
      supabase.from('chat_messages').select('id,conversation_id,sender_id,body,body_plain,created_at,updated_at,edited_at,deleted_at,metadata').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(500),
    ]);

    if (conversationError) throw conversationError;
    if (participantError) throw participantError;
    if (messagesError) throw messagesError;

    if (!conversation) {
      return { conversation: null, messages: [], members: [], profile };
    }

    const participantUserIds = Array.from(new Set((participantRows || []).map((row) => row.user_id).filter(Boolean)));
    const { data: users, error: usersError } = participantUserIds.length > 0
      ? await supabase.from('users').select('id,name,email').in('id', participantUserIds)
      : { data: [], error: null };

    if (usersError) throw usersError;

    const userMap = new Map((users || []).map((user) => [user.id, user]));
    const members = (participantRows || []).map((row) => {
      const user = userMap.get(row.user_id) || { id: row.user_id, name: row.user_id, email: null };
      return {
        id: user.id,
        name: user.name || user.email || user.id,
        email: user.email || null,
        role: row.role || 'member',
        last_read_at: row.last_read_at || null,
        muted_until: row.muted_until || null,
        blocked_at: row.blocked_at || null,
      };
    });

    return { conversation, messages: messages || [], members, profile };
  } catch (error) {
    if (!isRecoverableChatBackendError(error)) throw error;
    return fetchConversationThread(null, conversationId, currentUserId, fallbackUser);
  }
}

export async function createChatConversation(supabase, { createdBy, title, participantIds = [], isGroup = false, metadata = {} }) {
  const creator = createdBy;
  const participants = Array.from(new Set([creator, ...participantIds].filter(Boolean)));
  const cleanTitle = normalizeText(title, 120);

  if (!creator || participants.length < 2) {
    throw new Error('At least two participants are required.');
  }

  if (!supabase) {
    const state = seedLocalStateForUser({ id: creator, name: 'You', email: 'you@example.com' });
    const conversationId = randomId();
    const createdAt = nowIso();
    state.conversations.push({
      id: conversationId,
      title: cleanTitle || null,
      is_group: !!isGroup || participants.length > 2,
      created_by: creator,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
      metadata,
    });
    participants.forEach((userId) => {
      state.participants.push({
        conversation_id: conversationId,
        user_id: userId,
        role: userId === creator ? 'owner' : 'member',
        joined_at: createdAt,
        last_read_at: userId === creator ? createdAt : null,
        muted_until: null,
        blocked_at: null,
      });
    });
    saveLocalState(state);
    return { id: conversationId };
  }

  try {
    const { data: conversationRows, error: conversationError } = await supabase
      .from('chat_conversations')
      .insert({
        title: cleanTitle || null,
        is_group: !!isGroup || participants.length > 2,
        created_by: creator,
        metadata,
      })
      .select('id')
      .single();

    if (conversationError) throw conversationError;

    const conversationId = conversationRows.id;
    const rows = participants.map((userId) => ({
      conversation_id: conversationId,
      user_id: userId,
      role: userId === creator ? 'owner' : 'member',
      joined_at: nowIso(),
      last_read_at: userId === creator ? nowIso() : null,
      muted_until: null,
      blocked_at: null,
      metadata: {},
    }));

    const { error: participantError } = await supabase.from('chat_conversation_participants').insert(rows);
    if (participantError) throw participantError;

    return { id: conversationId };
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    return createChatConversation(null, { createdBy: creator, title: cleanTitle, participantIds, isGroup, metadata });
  }
}

export async function sendChatMessage(supabase, { conversationId, senderId, body, metadata = {} }) {
  const cleanBody = sanitizeChatBody(body);
  if (!conversationId || !senderId || !cleanBody) {
    throw new Error('Message is empty or invalid.');
  }

  if (!supabase) {
    const state = seedLocalStateForUser({ id: senderId, name: 'You', email: 'you@example.com' });
    const conversation = (state.conversations || []).find((row) => row.id === conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const message = {
      id: randomId(),
      conversation_id: conversationId,
      sender_id: senderId,
      body: cleanBody,
      body_plain: cleanBody,
      created_at: nowIso(),
      updated_at: nowIso(),
      edited_at: null,
      deleted_at: null,
      metadata,
    };
    state.messages.push(message);
    const conv = state.conversations.find((row) => row.id === conversationId);
    if (conv) conv.updated_at = message.created_at;
    const participant = state.participants.find((row) => row.conversation_id === conversationId && row.user_id === senderId);
    if (participant) participant.last_read_at = message.created_at;
    saveLocalState(state);
    return message;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        body: cleanBody,
        body_plain: cleanBody,
        metadata,
      })
      .select('id,conversation_id,sender_id,body,body_plain,created_at,updated_at,edited_at,deleted_at,metadata')
      .single();

    if (error) throw error;

    try {
      await supabase.rpc('chat_mark_conversation_read', { p_conversation_id: conversationId, p_user_id: senderId, p_read_at: nowIso() });
    } catch {
      // ignore if helper function is not available yet
    }

    try {
      await supabase.rpc('chat_touch_conversation', { p_conversation_id: conversationId, p_user_id: senderId });
    } catch {
      // ignore if helper function is not available yet
    }

    return data;
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    return sendChatMessage(null, { conversationId, senderId, body: cleanBody, metadata });
  }
}

export async function markConversationRead(supabase, conversationId, userId, messageId = null) {
  if (!conversationId || !userId) return null;

  if (!supabase) {
    const state = loadLocalState();
    const participant = state.participants.find((row) => row.conversation_id === conversationId && row.user_id === userId);
    const now = nowIso();
    if (participant) participant.last_read_at = now;
    saveLocalState(state);
    return true;
  }

  try {
    await supabase.rpc('chat_mark_conversation_read', { p_conversation_id: conversationId, p_user_id: userId, p_read_at: nowIso() });
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    return markConversationRead(null, conversationId, userId, messageId);
  }
  return true;
}

export async function toggleBlockUser(supabase, blockerId, blockedUserId, reason = 'user_blocked') {
  if (!blockerId || !blockedUserId || blockerId === blockedUserId) {
    throw new Error('Invalid block target.');
  }

  if (!supabase) {
    const state = seedLocalStateForUser({ id: blockerId, name: 'You', email: 'you@example.com' });
    const idx = state.blocks.findIndex((row) => row.blocker_id === blockerId && row.blocked_user_id === blockedUserId);
    if (idx >= 0) {
      state.blocks.splice(idx, 1);
      saveLocalState(state);
      return { blocked: false };
    }
    state.blocks.push({ blocker_id: blockerId, blocked_user_id: blockedUserId, reason, created_at: nowIso(), updated_at: nowIso(), metadata: {} });
    saveLocalState(state);
    return { blocked: true };
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from('chat_user_blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_user_id', blockedUserId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing && existing.id) {
      const { error: deleteError } = await supabase.from('chat_user_blocks').delete().eq('id', existing.id);
      if (deleteError) throw deleteError;
      return { blocked: false };
    }

    const { error: insertError } = await supabase.from('chat_user_blocks').insert({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
      reason,
      metadata: {},
    });
    if (insertError) throw insertError;
    return { blocked: true };
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    return toggleBlockUser(null, blockerId, blockedUserId, reason);
  }
}

export async function reportChatMessage(supabase, { messageId, reporterId, reason, details = '' }) {
  const cleanReason = normalizeText(reason, 120);
  const cleanDetails = normalizeMultiline(details, 500);
  if (!messageId || !reporterId || !cleanReason) {
    throw new Error('A reason is required to report a message.');
  }

  if (!supabase) {
    const state = loadLocalState();
    state.reports.push({
      id: randomId(),
      message_id: messageId,
      reporter_id: reporterId,
      reason: cleanReason,
      details: cleanDetails,
      created_at: nowIso(),
      resolved_at: null,
      resolved_by: null,
      metadata: {},
    });
    saveLocalState(state);
    return { ok: true };
  }

  try {
    const { error } = await supabase.from('chat_message_reports').insert({
      message_id: messageId,
      reporter_id: reporterId,
      reason: cleanReason,
      details: cleanDetails || null,
      metadata: {},
    });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    if (!isMissingChatTableError(error)) throw error;
    return reportChatMessage(null, { messageId, reporterId, reason: cleanReason, details: cleanDetails });
  }
}

export async function fetchForumRooms(supabase, limit = 120) {
  if (!supabase) {
    return [
      { id: 'room-local-1', name: 'Library', location: 'Main Building' },
      { id: 'room-local-2', name: 'Lecture Hall A', location: 'North Wing' },
      { id: 'room-local-3', name: 'Computer Lab 2', location: 'East Wing' },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id,name,location')
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (!isRecoverableChatBackendError(error)) throw error;
    return fetchForumRooms(null, limit);
  }
}

export async function ensureRoomForumConversation(supabase, { roomId, roomName, userId }) {
  if (!roomId || !roomName || !userId) {
    throw new Error('Room and user are required.');
  }

  if (!supabase) {
    const state = seedLocalStateForUser({ id: userId, name: 'You', email: 'you@example.com' });
    let convo = (state.conversations || []).find((row) => row && row.metadata && row.metadata.chat_mode === 'room_forum' && row.metadata.room_id === roomId);
    if (!convo) {
      convo = {
        id: randomId(),
        title: `${roomName} Forum`,
        is_group: true,
        created_by: userId,
        created_at: nowIso(),
        updated_at: nowIso(),
        archived_at: null,
        metadata: {
          chat_mode: 'room_forum',
          room_id: roomId,
          room_name: roomName,
          forum: true,
        },
      };
      state.conversations.push(convo);
    }

    const exists = (state.participants || []).some((row) => row.conversation_id === convo.id && row.user_id === userId);
    if (!exists) {
      state.participants.push({
        conversation_id: convo.id,
        user_id: userId,
        role: 'member',
        joined_at: nowIso(),
        last_read_at: nowIso(),
        muted_until: null,
        blocked_at: null,
      });
    }

    saveLocalState(state);
    return convo;
  }

  try {
    const { data: existingRows, error: existingError } = await supabase
      .from('chat_conversations')
      .select('id,title,is_group,created_by,created_at,updated_at,archived_at,metadata')
      .contains('metadata', { chat_mode: 'room_forum', room_id: String(roomId) })
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    let conversation = (existingRows || [])[0] || null;

    if (!conversation) {
      const { data: inserted, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          title: `${roomName} Forum`,
          is_group: true,
          created_by: userId,
          metadata: {
            chat_mode: 'room_forum',
            room_id: String(roomId),
            room_name: String(roomName),
            forum: true,
          },
        })
        .select('id,title,is_group,created_by,created_at,updated_at,archived_at,metadata')
        .single();

      if (insertError) throw insertError;
      conversation = inserted;
    }

    await supabase
      .from('chat_conversation_participants')
      .upsert({
        conversation_id: conversation.id,
        user_id: userId,
        role: 'member',
        joined_at: nowIso(),
        last_read_at: nowIso(),
        muted_until: null,
        blocked_at: null,
      }, { onConflict: 'conversation_id,user_id' });

    return conversation;
  } catch (error) {
    if (!isRecoverableChatBackendError(error)) throw error;
    return ensureRoomForumConversation(null, { roomId, roomName, userId });
  }
}

export async function fetchRoomForumPosts(supabase, conversationId, limit = 250) {
  if (!conversationId) return { messages: [], usersById: {} };

  if (!supabase) {
    const state = loadLocalState();
    const messages = (state.messages || [])
      .filter((row) => row.conversation_id === conversationId && !row.deleted_at)
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      .slice(-limit);

    const usersById = {};
    (state.users || []).forEach((u) => {
      usersById[u.id] = { id: u.id, name: u.name || u.email || u.id, email: u.email || null };
    });
    return { messages, usersById };
  }

  try {
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id,conversation_id,sender_id,body,body_plain,created_at,updated_at,edited_at,deleted_at,metadata')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (messagesError) throw messagesError;

    const senderIds = Array.from(new Set((messages || []).map((m) => m.sender_id).filter(Boolean)));

    let users = [];
    if (senderIds.length) {
      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('chat_list_visible_user_briefs', {
          p_conversation_id: conversationId,
          p_user_ids: senderIds,
        });
        if (rpcError) throw rpcError;
        users = Array.isArray(rpcUsers) ? rpcUsers : [];
      } catch (rpcErr) {
        if (!isMissingFunctionError(rpcErr)) throw rpcErr;

        const { data: directUsers, error: usersError } = await supabase
          .from('users')
          .select('id,name,email')
          .in('id', senderIds);
        if (usersError) throw usersError;
        users = Array.isArray(directUsers) ? directUsers : [];
      }
    }

    const usersById = {};
    (users || []).forEach((u) => {
      usersById[u.id] = { id: u.id, name: u.name || u.email || u.id, email: u.email || null };
    });

    (messages || []).forEach((message) => {
      const senderId = message && message.sender_id ? String(message.sender_id) : '';
      if (!senderId || usersById[senderId]) return;

      const metadata = message && message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
      const senderName = normalizeText(metadata.sender_name || metadata.senderName || metadata.display_name || '', 120);
      const senderEmail = normalizeText(metadata.sender_email || metadata.senderEmail || '', 160);

      usersById[senderId] = {
        id: senderId,
        name: senderName || senderEmail || senderId,
        email: senderEmail || null,
      };
    });

    return { messages: messages || [], usersById };
  } catch (error) {
    if (!isRecoverableChatBackendError(error)) throw error;
    return fetchRoomForumPosts(null, conversationId, limit);
  }
}

export function subscribeToChatRealtime(supabase, currentUserId, onInvalidate) {
  if (!supabase || !currentUserId || typeof onInvalidate !== 'function') return null;

  try {
    const channel = supabase.channel(`chat-live-${currentUserId}`);
    const tables = [
      'chat_conversations',
      'chat_conversation_participants',
      'chat_messages',
      'chat_message_reads',
      'chat_user_blocks',
      'chat_message_reports',
    ];

    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, onInvalidate);
    });

    channel.subscribe();
    return channel;
  } catch {
    return null;
  }
}

export function seedLocalChatState(currentUser) {
  return seedLocalStateForUser(currentUser || null);
}
