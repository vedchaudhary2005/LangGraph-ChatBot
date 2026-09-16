import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from '@clerk/clerk-react';
import { streamChat, fetchChatHistory, fetchUserChats, deleteUserChat } from '../lib/api';


// localStorage key — stores the active conversation's checkpoint_id only.
// The full chat content comes from MongoDB (via the backend).
const LS_KEY = 'active_checkpoint_id';

function lsGet() {
  try { return localStorage.getItem(LS_KEY) || null; } catch { return null; }
}
function lsSet(id) {
  try { localStorage.setItem(LS_KEY, id); } catch {}
}
function lsClear() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

/**
 * useChatStream — central hook managing all chat state.
 *
 * PERSISTENCE ARCHITECTURE:
 * - localStorage holds ONE value: the active checkpoint_id.
 * - On mount, once Clerk session is loaded, we fetch the user's saved chats
 *   from MongoDB (via GET /chats and GET /chat_history/{id}).
 * - MongoDB is the SINGLE SOURCE OF TRUTH for message content.
 * - Clicking "New Chat" clears active_checkpoint_id from localStorage and resets
 *   the active chat view, but retains past conversations in MongoDB and sidebar.
 */
export function useChatStream() {
  const { isLoaded, session } = useSession();

  // Each entry: { id, title, messages: [], checkpointId: string|null }
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);

  // null | { phase: 'searching'|'done', query: string, urls: string[] }
  const [searchState, setSearchState] = useState(null);

  const focusInputRef = useRef(null);
  const abortRef = useRef(null);
  const restoredRef = useRef(false);

  // ----------------------------------------------------------------
  // Derived state
  // ----------------------------------------------------------------
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const messages = activeConversation?.messages ?? [];

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  function makeId() {
    return Math.random().toString(36).slice(2, 10);
  }

  function makeTitle(text) {
    if (!text) return 'New Chat';
    return text.length > 45 ? text.slice(0, 45) + '…' : text;
  }

  // ----------------------------------------------------------------
  // Restore all user chats & active conversation on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    // Wait until Clerk is fully initialized and session is ready
    if (!isLoaded || !session) return;
    if (restoredRef.current) return;
    restoredRef.current = true;

    let isCancelled = false;

    async function restore() {
      setIsRestoringHistory(true);

      let token;
      try {
        token = await session.getToken();
      } catch (err) {
        console.error('[useChatStream] Failed to get session token:', err);
        setIsRestoringHistory(false);
        return;
      }

      if (!token || isCancelled) {
        setIsRestoringHistory(false);
        return;
      }

      // 1. Fetch all user chats from MongoDB
      const userChats = await fetchUserChats(token);

      if (isCancelled) return;

      const savedCheckpointId = lsGet();

      // Convert backend chats into React conversation format
      const loadedConvs = (userChats || []).map((chat) => ({
        id: chat.checkpoint_id,
        title: chat.title || 'Conversation',
        checkpointId: chat.checkpoint_id,
        messages: (chat.messages || []).map((m) => ({
          id: makeId(),
          role: m.role,
          content: m.content,
          streaming: false,
        })),
      }));

      // If we have a saved active_checkpoint_id, restore that specific conversation
      if (savedCheckpointId) {
        let matched = loadedConvs.find((c) => c.checkpointId === savedCheckpointId);

        // Fallback: If not in /chats list, query /chat_history/{savedCheckpointId} directly
        if (!matched) {
          const singleChat = await fetchChatHistory(savedCheckpointId, token);
          if (singleChat && singleChat.messages && singleChat.messages.length > 0) {
            const firstUser = singleChat.messages.find((m) => m.role === 'user');
            const title = firstUser ? makeTitle(firstUser.content) : 'Conversation';
            matched = {
              id: savedCheckpointId,
              title,
              checkpointId: savedCheckpointId,
              messages: singleChat.messages.map((m) => ({
                id: makeId(),
                role: m.role,
                content: m.content,
                streaming: false,
              })),
            };
            loadedConvs.unshift(matched);
          } else {
            // Stale/invalid checkpoint ID in localStorage
            lsClear();
          }
        }

        setConversations(loadedConvs);
        if (matched) {
          setActiveConversationId(matched.id);
        } else {
          setActiveConversationId(null);
        }
      } else {
        // No active_checkpoint_id in localStorage — show sidebar chats, empty main window for new chat
        setConversations(loadedConvs);
        setActiveConversationId(null);
      }

      setIsRestoringHistory(false);
    }

    restore();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, session]);

  // ----------------------------------------------------------------
  // New Chat — clears active checkpoint from localStorage and resets view
  // ----------------------------------------------------------------
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    lsClear();                     // clear active_checkpoint_id from localStorage
    setActiveConversationId(null);
    setIsStreaming(false);
    setError(null);
    setSearchState(null);
    setTimeout(() => focusInputRef.current?.(), 50);
  }, []);

  // ----------------------------------------------------------------
  // Register input focus callback
  // ----------------------------------------------------------------
  const registerFocusInput = useCallback((fn) => {
    focusInputRef.current = fn;
  }, []);

  // ----------------------------------------------------------------
  // Select conversation from sidebar
  // ----------------------------------------------------------------
  const selectConversation = useCallback(
    (id) => {
      if (isStreaming) return;
      const conv = conversations.find((c) => c.id === id);
      if (conv?.checkpointId) {
        lsSet(conv.checkpointId);   // update active_checkpoint_id in localStorage
      }
      setActiveConversationId(id);
      setError(null);
      setSearchState(null);
      setTimeout(() => focusInputRef.current?.(), 50);
    },
    [isStreaming, conversations]
  );

  // ----------------------------------------------------------------
  // Send Message
  // ----------------------------------------------------------------
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;

      setError(null);
      setSearchState(null);

      let token;
      try {
        token = await session.getToken();
      } catch (err) {
        console.error('[useChatStream] failed to get token:', err);
        setError('Your session has expired. Please sign in again.');
        return;
      }
      if (!token) {
        setError('Your session has expired. Please sign in again.');
        return;
      }

      let convId = activeConversationId;
      let existingCheckpointId = null;

      if (!convId) {
        // Create new conversation in React state
        convId = makeId();
        const newConv = {
          id: convId,
          title: makeTitle(text),
          messages: [],
          checkpointId: null,
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(convId);
      } else {
        existingCheckpointId =
          activeConversation?.checkpointId ||
          conversations.find((c) => c.id === convId)?.checkpointId ||
          lsGet() ||
          null;

        if (
          activeConversation?.title === 'New Chat' ||
          activeConversation?.messages.length === 0
        ) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, title: makeTitle(text) } : c
            )
          );
        }
      }

      // Add user message + assistant placeholder
      const userMsgId = makeId();
      const assistantMsgId = makeId();

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: [
              ...c.messages,
              { id: userMsgId, role: 'user', content: text },
              { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
            ],
          };
        })
      );

      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let activeId = convId;

      // ── SSE callbacks ──────────────────────────────────────────
      const callbacks = {
        onCheckpoint: (checkpointId) => {
          activeId = checkpointId;
          // Save checkpoint_id to localStorage immediately on receiving it
          lsSet(checkpointId);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId || c.checkpointId === checkpointId
                ? { ...c, id: checkpointId, checkpointId }
                : c
            )
          );
          setActiveConversationId(checkpointId);
        },

        onContent: (chunk) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeId && c.id !== convId && c.checkpointId !== activeId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + chunk }
                    : m
                ),
              };
            })
          );
        },

        onSearchStart: (query) => {
          setSearchState({ phase: 'searching', query, urls: [] });
        },

        onSearchResults: (urls) => {
          setSearchState((prev) =>
            prev
              ? { ...prev, phase: 'done', urls }
              : { phase: 'done', query: '', urls }
          );
        },

        onEnd: () => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeId && c.id !== convId && c.checkpointId !== activeId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, streaming: false } : m
                ),
              };
            })
          );
          setIsStreaming(false);
        },

        onError: (msg) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeId && c.id !== convId && c.checkpointId !== activeId) return c;
              return {
                ...c,
                messages: c.messages.filter((m) => m.id !== assistantMsgId),
              };
            })
          );
          setError(msg);
          setIsStreaming(false);
        },
      };

      await streamChat(
        text,
        existingCheckpointId,
        token,
        callbacks,
        controller.signal
      );

      setIsStreaming(false);
    },
    [isStreaming, activeConversationId, activeConversation, conversations, session]
  );

  // ----------------------------------------------------------------
  // Stop streaming
  // ----------------------------------------------------------------
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.streaming ? { ...m, streaming: false } : m
        ),
      }))
    );
  }, []);

  // ----------------------------------------------------------------
  // Delete Chat
  // ----------------------------------------------------------------
  const deleteChat = useCallback(
    async (id) => {
      let token;
      try {
        token = await session?.getToken();
      } catch (err) {
        console.error('[useChatStream] deleteChat failed to get token:', err);
        setError('Your session has expired. Please sign in again.');
        return false;
      }

      if (!token) return false;

      const conv = conversations.find((c) => c.id === id);
      const threadId = conv?.checkpointId || id;

      const success = await deleteUserChat(threadId, token);
      if (success) {
        const savedCheckpointId = lsGet();
        if (savedCheckpointId === threadId || activeConversationId === id || activeConversationId === conv?.id) {
          lsClear();
          setActiveConversationId(null);
          setIsStreaming(false);
          setError(null);
          setSearchState(null);
        }

        setConversations((prev) =>
          prev.filter((c) => c.id !== id && c.checkpointId !== threadId)
        );
        return true;
      } else {
        setError('Failed to delete chat. Please try again.');
        return false;
      }
    },
    [session, conversations, activeConversationId]
  );

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    isStreaming,
    isRestoringHistory,
    error,
    searchState,
    sendMessage,
    newChat,
    selectConversation,
    deleteChat,
    stopStreaming,
    setError,
    registerFocusInput,
  };
}

