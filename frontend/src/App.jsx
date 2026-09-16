import { useState } from 'react';
import {
  SignedIn,
  SignedOut,
  SignIn,
  useUser,
  useSession,
} from '@clerk/clerk-react';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChatStream } from './hooks/useChatStream';

/**
 * AppContent — the actual app (needs ThemeProvider above it).
 */
function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();

  const {
    conversations,
    activeConversationId,
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
  } = useChatStream();

  return (
    <>
      {/* ── Unauthenticated ──────────────────────────────────── */}
      <SignedOut>
        <div
          className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center
                         bg-gradient-to-br from-violet-500 to-purple-700
                         shadow-xl shadow-violet-500/30"
            >
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                LangGraph AI
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Powered by Gemini + Tavily
              </p>
            </div>
          </div>

          {/* Clerk sign-in */}
          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#7c3aed',
                colorBackground: isDark ? '#161616' : '#ffffff',
                colorText: isDark ? '#ececec' : '#111111',
                colorInputBackground: isDark ? '#1e1e1e' : '#f9f9f9',
                colorInputText: isDark ? '#ececec' : '#111111',
                borderRadius: '14px',
              },
              elements: {
                card: 'shadow-2xl',
                footerActionLink: 'text-violet-500 hover:text-violet-400',
              },
            }}
          />
        </div>
      </SignedOut>

      {/* ── Authenticated ────────────────────────────────────── */}
      <SignedIn>
        <div
          className="flex h-screen h-[100dvh] overflow-hidden"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >

          {/* Sidebar */}
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNewChat={newChat}
            onSelectConversation={selectConversation}
            onDeleteChat={deleteChat}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />


          {/* Main area */}
          <div className="flex flex-col flex-1 min-w-0 h-full">

            {/* Mobile top bar */}
            <div
              className="flex md:hidden items-center justify-between
                         px-4 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                {/* Hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="transition-colors duration-150"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  LangGraph AI
                </span>
              </div>

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           transition-colors duration-150"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-muted)',
                }}
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707
                         M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707
                         M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003
                         9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Chat window — fills remaining space */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                messages={messages}
                searchState={searchState}
                isStreaming={isStreaming}
                isRestoringHistory={isRestoringHistory}
                error={error}
                onSend={sendMessage}
                onStop={stopStreaming}
                onErrorDismiss={() => setError(null)}
                onRegisterFocus={registerFocusInput}
              />
            </div>
          </div>

          {/* ── Developer Auth Debug Panel (Dev / Mobile Testing Only) ───── */}
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="fixed bottom-3 left-3 z-40 px-2.5 py-1 rounded-lg text-[11px] font-mono
                       border shadow-md transition-opacity opacity-70 hover:opacity-100"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            🐛 Debug Auth
          </button>

          {showDebug && (
            <div
              className="fixed bottom-12 left-3 z-50 w-72 max-w-[calc(100vw-24px)] rounded-xl p-3 text-xs font-mono
                         border shadow-2xl space-y-1.5"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold text-[11px] uppercase tracking-wider text-violet-400">Auth Diagnostics</span>
                <button onClick={() => setShowDebug(false)} className="text-muted-th hover:opacity-75">✕</button>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Clerk loaded:</span><span className={isLoaded ? 'text-green-400' : 'text-red-400'}>{isLoaded ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between"><span>Signed in:</span><span className={isSignedIn ? 'text-green-400' : 'text-red-400'}>{isSignedIn ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between"><span>User ID exists:</span><span className={user?.id ? 'text-green-400' : 'text-red-400'}>{user?.id ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between"><span>Session active:</span><span className={session ? 'text-green-400' : 'text-red-400'}>{session ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between truncate gap-1"><span>API URL:</span><span className="text-violet-300 truncate max-w-[140px]">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span></div>
                {error && <div className="text-red-400 break-words mt-1 border-t pt-1" style={{ borderColor: 'var(--border)' }}>Detail: {error}</div>}
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </>
  );
}


/**
 * App — root component, wraps everything in ThemeProvider.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
