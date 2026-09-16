import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import SearchIndicator from './SearchIndicator';

const SUGGESTIONS = [
  'What is LangGraph?',
  'Explain RAG in simple terms',
  'Search the web for latest AI news',
  'Write a Python function to sort a dict by value',
];

/**
 * MessageList — scrollable conversation with auto-scroll.
 *
 * Props:
 *   messages:    array of message objects
 *   searchState: from useChatStream
 *   isStreaming: bool
 *   onSuggestion:(text: string) => void  — called when a suggestion chip is clicked
 */
export default function MessageList({ messages, searchState, isStreaming, onSuggestion }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, searchState]);

  // ── Empty / welcome state ─────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center
                   px-4 sm:px-6 py-6 sm:py-16 text-center my-auto w-full"
      >
        {/* Logo mark */}
        <div
          className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-6 flex items-center justify-center
                     bg-gradient-to-br from-violet-500 to-purple-700
                     shadow-xl shadow-violet-500/25"
        >
          <svg
            className="w-5 h-5 sm:w-7 sm:h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
                 m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547
                 A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
                 c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        <h2
          className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          LangGraph AI
        </h2>
        <p
          className="text-xs sm:text-sm mb-4 sm:mb-8 max-w-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Ask anything and get an AI-powered response.
          I can search the web and hold multi-turn conversations.
        </p>

        {/* Clickable suggestion cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion?.(s)}
              className="text-left text-xs sm:text-sm px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border
                         transition-all duration-150 hover:scale-[1.01] active:scale-100"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Conversation ──────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto py-3 sm:py-6 w-full">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-5 w-full">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />

            {/* Search indicator: show below the last user message when searching */}
            {msg.role === 'user' &&
              idx === messages.length - 2 &&
              searchState && (
                <div className="mt-2 ml-8 sm:ml-10">
                  <SearchIndicator searchState={searchState} />
                </div>
              )}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );

}
