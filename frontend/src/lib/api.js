/**
 * api.js — All communication with the FastAPI backend.
 *
 * WHY FETCH INSTEAD OF EventSource:
 * EventSource does not support custom request headers.
 * We must send "Authorization: Bearer <token>" on every request,
 * so we use fetch() + ReadableStream to consume the SSE stream manually.
 */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Stream a chat message from the backend.
 *
 * @param {string}      message       - The user's message text
 * @param {string|null} checkpointId  - Existing thread ID (null = new chat)
 * @param {string}      token         - Clerk session token (Bearer)
 * @param {object}      callbacks     - SSE event handlers
 * @param {function}    callbacks.onCheckpoint    - (id: string) => void
 * @param {function}    callbacks.onContent       - (chunk: string) => void
 * @param {function}    callbacks.onSearchStart   - (query: string) => void
 * @param {function}    callbacks.onSearchResults - (urls: string[]) => void
 * @param {function}    callbacks.onEnd           - () => void
 * @param {function}    callbacks.onError         - (message: string) => void
 * @param {AbortSignal} [signal]                  - Optional abort signal
 */
export async function streamChat(
  message,
  checkpointId,
  token,
  callbacks,
  signal
) {
  const { onCheckpoint, onContent, onSearchStart, onSearchResults, onEnd, onError } = callbacks;

  // Build URL — properly encode the message as a path segment
  const encodedMessage = encodeURIComponent(message);
  const url = new URL(`${API_URL}/chat_stream/${encodedMessage}`);

  if (checkpointId) {
    url.searchParams.set('checkpoint_id', checkpointId);
  }

  let response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[api] fetch error:', err);
    onError('Unable to connect to the server. Please make sure the backend is running.');
    return;
  }

  // Handle HTTP error codes
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.detail || '';
    } catch (_) {
      // ignore JSON parse failure on error body
    }

    if (response.status === 401 || response.status === 403) {
      console.error('[api] auth error:', response.status, detail);
      onError('Your session has expired. Please sign in again.');
    } else if (response.status >= 500) {
      console.error('[api] server error:', response.status, detail);
      onError('The server encountered an error. Please try again.');
    } else {
      console.error('[api] HTTP error:', response.status, detail);
      onError('Something went wrong. Please try again.');
    }
    return;
  }

  // Read the SSE stream incrementally using ReadableStream
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Accumulate decoded bytes (stream: true keeps state across chunks)
      buffer += decoder.decode(value, { stream: true });

      // SSE message blocks are separated by double newline
      const parts = buffer.split('\n\n');

      // Keep the last partial block in the buffer
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        // Find the "data:" line within this SSE block
        const dataLine = part
          .split('\n')
          .find((line) => line.startsWith('data:'));

        if (!dataLine) continue;

        const jsonStr = dataLine.slice(5).trim(); // remove "data:" prefix

        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn('[api] failed to parse SSE JSON:', jsonStr, e);
          continue;
        }

        switch (parsed.type) {
          case 'checkpoint':
            onCheckpoint?.(parsed.checkpoint_id);
            break;
          case 'content':
            onContent?.(parsed.content);
            break;
          case 'search_start':
            onSearchStart?.(parsed.query);
            break;
          case 'search_results':
            onSearchResults?.(parsed.urls ?? []);
            break;
          case 'error':
            onError?.(parsed.message || 'An error occurred while generating the response.');
            break;
          case 'end':
            onEnd?.();
            break;
          default:
            console.warn('[api] unknown SSE event type:', parsed.type);
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[api] stream read error:', err);
    onError('Connection interrupted. Please try again.');
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch saved messages for an existing conversation from the backend.
 *
 * @param {string} checkpointId - The thread/checkpoint ID
 * @param {string} token        - Clerk session token
 * @returns {Promise<{checkpoint_id: string, messages: {role,content}[]}|null>}
 */
export async function fetchChatHistory(checkpointId, token) {
  const url = `${API_URL}/chat_history/${encodeURIComponent(checkpointId)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[api] fetchChatHistory HTTP error:', response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn('[api] fetchChatHistory failed:', err);
    return null;
  }
}

/**
 * Fetch all saved chat threads for the authenticated user.
 *
 * @param {string} token - Clerk session token
 * @returns {Promise<{checkpoint_id: string, title: string, messages: {role, content}[]}[]>}
 */
export async function fetchUserChats(token) {
  const url = `${API_URL}/chats`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[api] fetchUserChats HTTP error:', response.status);
      return [];
    }

    return await response.json();
  } catch (err) {
    console.warn('[api] fetchUserChats failed:', err);
    return [];
  }
}

/**
 * Delete a saved conversation for the authenticated user.
 *
 * @param {string} threadId - The thread ID to delete
 * @param {string} token    - Clerk session token
 * @returns {Promise<boolean>} True if successfully deleted
 */
export async function deleteUserChat(threadId, token) {
  const url = `${API_URL}/chats/${encodeURIComponent(threadId)}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[api] deleteUserChat HTTP error:', response.status);
      return false;
    }

    const data = await response.json();
    return data?.success === true;
  } catch (err) {
    console.warn('[api] deleteUserChat failed:', err);
    return false;
  }
}


