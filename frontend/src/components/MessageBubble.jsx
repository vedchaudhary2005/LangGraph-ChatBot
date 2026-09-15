import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * MessageBubble — ChatGPT-style vertical message layout.
 *
 * User messages:      plain text in a violet bubble (right-aligned).
 * Assistant messages: Markdown rendered, with avatar (left-aligned).
 *
 * Props:
 *   message: { id, role: 'user'|'assistant', content: string, streaming?: boolean }
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && message.streaming;

  // ── User message ─────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-1">
        <div
          className="max-w-[85%] md:max-w-[75%] lg:max-w-[65%]
                     rounded-2xl rounded-tr-sm px-4 py-3
                     bg-violet-600 text-white shadow-sm"
        >
          {/* User messages are plain text — no Markdown rendering */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // ── Assistant message ─────────────────────────────────────────────
  return (
    <div className="flex items-start gap-3 mb-1">
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full mt-0.5
                   bg-gradient-to-br from-violet-500 to-purple-700
                   flex items-center justify-center shadow-md shadow-violet-500/20"
      >
        <svg
          className="w-3.5 h-3.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
               m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547
               A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
               c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isEmpty ? (
          /* Thinking dots while waiting for first token */
          <div className="flex items-center gap-1.5 h-6">
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '300ms' }}
            />
          </div>
        ) : (
          <div
            className={`prose-chat text-sm ${message.streaming ? 'streaming-cursor' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Custom renderers — themed, no external CSS dependency ─────────

const markdownComponents = {
  // Paragraphs
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),

  // Headings
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold mb-1 mt-2" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h4>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 pl-4 my-3 italic"
      style={{ borderColor: 'var(--accent)', color: 'var(--text-secondary)' }}
    >
      {children}
    </blockquote>
  ),

  // Inline code
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded text-[0.8em] font-mono"
          style={{
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {children}
        </code>
      );
    }
    // Fenced code block
    return (
      <div className="my-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-1.5 text-xs font-mono"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-faint)',
          }}
        >
          <span>{className?.replace('language-', '') || 'code'}</span>
        </div>
        {/* Code body */}
        <pre
          className="overflow-x-auto p-4 text-xs font-mono leading-relaxed"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', margin: 0 }}
        >
          <code>{children}</code>
        </pre>
      </div>
    );
  },

  // Horizontal rule
  hr: () => (
    <hr className="my-4" style={{ borderColor: 'var(--border)' }} />
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-opacity hover:opacity-75"
      style={{ color: '#a78bfa' }}
    >
      {children}
    </a>
  ),

  // Bold / strong
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
      {children}
    </strong>
  ),

  // Italic / em
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),

  // Tables (GFM)
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table
        className="min-w-full text-xs border-collapse"
        style={{ border: '1px solid var(--border)' }}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>{children}</thead>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left font-semibold"
      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="px-3 py-2"
      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}
    >
      {children}
    </td>
  ),
};
