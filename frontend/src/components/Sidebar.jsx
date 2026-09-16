import { useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Sidebar — left panel with nav, conversation list, and user controls.
 *
 * Props:
 *   conversations:          { id, title }[]
 *   activeConversationId:   string | null
 *   onNewChat:              () => void
 *   onSelectConversation:   (id: string) => void
 *   onDeleteChat:           (id: string) => Promise<boolean>
 *   isOpen:                 bool  (mobile drawer)
 *   onClose:                () => void
 */
export default function Sidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteChat,
  isOpen,
  onClose,
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          flex flex-col w-[260px] h-full border-r
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Logo + name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700
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
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              LangGraph AI
            </span>
          </div>

          {/* Right side: theme toggle + close (mobile) */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         transition-colors duration-150"
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.08)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {isDark ? (
                // Sun icon — switch to light
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707
                       M6.343 6.343l-.707-.707m12.728 0l-.707.707
                       M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon — switch to dark
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003
                       9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Mobile close button */}
            <button
              className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center
                         transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── New Chat button ──────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                       font-medium border transition-all duration-150"
            style={{
              backgroundColor: 'rgba(124,58,237,0.1)',
              borderColor: 'rgba(124,58,237,0.25)',
              color: '#a78bfa',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.18)';
              e.currentTarget.style.color = '#c4b5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.1)';
              e.currentTarget.style.color = '#a78bfa';
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* ── Conversation list ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <p
                className="text-xs"
                style={{ color: 'var(--text-faint)' }}
              >
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 mt-1">
              {/* Section label */}
              <p
                className="text-[10px] font-medium uppercase tracking-wider px-2 py-1"
                style={{ color: 'var(--text-faint)' }}
              >
                Recent
              </p>

              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className="group relative flex items-center rounded-lg transition-colors duration-100"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <button
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                      title={conv.title}
                      className="flex-1 min-w-0 text-left flex items-center gap-2 px-3 py-2
                                 text-sm truncate transition-colors duration-100"
                      style={{
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: 'var(--text-faint)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6
                             a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
                        />
                      </svg>
                      <span className="truncate">{conv.title}</span>
                    </button>

                    {/* Delete chat button (Trash icon) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteId(conv.id);
                      }}
                      title="Delete chat"
                      className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1.5 mr-1.5 rounded-md
                                 transition-opacity hover:text-red-400 focus:opacity-100"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Bottom — user profile ────────────────────────────── */}
        <div
          className="flex-shrink-0 px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: { avatarBox: 'w-8 h-8' },
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Signed in
            </span>
          </div>
        </div>
      </aside>

      {/* ── Confirmation Modal for Chat Deletion ────────────────────────────── */}
      {confirmingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => !isDeleting && setConfirmingDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 border shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Delete this chat?
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingDeleteId(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  if (onDeleteChat) {
                    await onDeleteChat(confirmingDeleteId);
                  }
                  setIsDeleting(false);
                  setConfirmingDeleteId(null);
                }}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

