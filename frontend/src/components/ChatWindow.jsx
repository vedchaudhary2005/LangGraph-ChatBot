import MessageList from './MessageList';
import ChatInput from './ChatInput';

/**
 * ChatWindow — main right-pane area.
 *
 * Props:
 *   messages:            array of message objects
 *   searchState:         from useChatStream
 *   isStreaming:         bool
 *   isRestoringHistory:  bool — true while fetching saved chat from backend
 *   error:               string | null
 *   onSend:              (text) => void
 *   onStop:              () => void
 *   onErrorDismiss:      () => void
 *   onRegisterFocus:     (fn) => void
 */
export default function ChatWindow({
  messages,
  searchState,
  isStreaming,
  isRestoringHistory,
  error,
  onSend,
  onStop,
  onErrorDismiss,
  onRegisterFocus,
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Error banner ──────────────────────────────────────── */}
      {error && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3
                     border-b text-sm"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.2)',
          }}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ color: '#f87171' }}
          >
            {/* Warning icon */}
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                   1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082
                   16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={onErrorDismiss}
            className="flex-shrink-0 ml-4 transition-opacity duration-150 hover:opacity-70"
            style={{ color: '#f87171' }}
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Message list ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <MessageList
          messages={messages}
          searchState={searchState}
          isStreaming={isStreaming}
          onSuggestion={onSend}
        />
      </div>

      {/* ── Generating indicator ──────────────────────────────── */}
      {isStreaming && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-6 py-2 text-xs"
          style={{ color: '#a78bfa' }}
        >
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
          Generating…
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <ChatInput
          onSend={onSend}
          isStreaming={isStreaming}
          onStop={onStop}
          onRegisterFocus={onRegisterFocus}
        />
      </div>
    </div>
  );
}
