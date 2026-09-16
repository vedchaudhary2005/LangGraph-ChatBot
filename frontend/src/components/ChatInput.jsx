import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ChatInput — message composer at the bottom of the chat.
 *
 * Props:
 *   onSend:           (text: string) => void
 *   isStreaming:      bool
 *   onStop:           () => void
 *   onRegisterFocus:  (fn: () => void) => void  — registers the focus function
 */
export default function ChatInput({ onSend, isStreaming, onStop, onRegisterFocus }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Register the focus function with the parent hook
  useEffect(() => {
    onRegisterFocus?.(() => textareaRef.current?.focus());
  }, [onRegisterFocus]);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setText('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSend(trimmed);
    // Re-focus after send
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [text, isStreaming, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !isStreaming;

  return (
    <div className="px-3 md:px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-3xl mx-auto">
        {/* Input container */}
        <div
          className="flex items-end gap-2.5 rounded-2xl px-4 py-3 shadow-sm
                     border transition-colors duration-200"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border)',
          }}
          onFocus={() => {
            const el = document.activeElement?.closest('.input-container');
            if (el) el.style.borderColor = 'var(--accent)';
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Message LangGraph AI…"
            className="flex-1 bg-transparent text-sm resize-none outline-none
                       max-h-[200px] leading-relaxed disabled:opacity-50
                       disabled:cursor-not-allowed placeholder:text-[--text-faint]"
            style={{ color: 'var(--text-primary)' }}
          />

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStop}
              title="Stop generation"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center
                         justify-center transition-colors duration-150"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')
              }
            >
              <svg
                className="w-3.5 h-3.5"
                style={{ color: '#f87171' }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="Send (Enter)"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center
                         justify-center transition-all duration-150"
              style={{
                backgroundColor: canSend
                  ? 'var(--accent)'
                  : 'var(--bg-hover)',
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              <svg
                className="w-4 h-4"
                style={{
                  color: canSend ? '#ffffff' : 'var(--text-faint)',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        <p
          className="text-center text-xs mt-2"
          style={{ color: 'var(--text-faint)' }}
        >
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
