/**
 * SearchIndicator — shown during and after a Tavily web search.
 *
 * Props:
 *   searchState: null | { phase: 'searching'|'done', query: string, urls: string[] }
 */
export default function SearchIndicator({ searchState }) {
  if (!searchState) return null;

  const { phase, query, urls } = searchState;
  const isSearching = phase === 'searching';

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {/* Animated icon */}
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full mt-0.5 flex items-center justify-center
                    ${isSearching ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor: isSearching
            ? 'rgba(124,58,237,0.15)'
            : 'rgba(16,185,129,0.15)',
        }}
      >
        {isSearching ? (
          <svg
            className="w-3 h-3"
            style={{ color: '#a78bfa' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3"
            style={{ color: '#34d399' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      {/* Text + URLs */}
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isSearching ? (
            <>
              🔎{' '}Searching the web
              {query && (
                <>
                  {' '}for{' '}
                  <span style={{ color: '#a78bfa' }} className="font-medium">
                    "{query}"
                  </span>
                </>
              )}
              …
            </>
          ) : (
            <>
              ✓{' '}Web search complete
              {query && (
                <>
                  {' '}for{' '}
                  <span style={{ color: '#34d399' }} className="font-medium">
                    "{query}"
                  </span>
                </>
              )}
            </>
          )}
        </p>

        {/* Source URLs */}
        {urls && urls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {urls.map((url, i) => {
              let hostname = url;
              try {
                hostname = new URL(url).hostname.replace(/^www\./, '');
              } catch (_) {}

              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={url}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5
                             rounded-full border transition-colors duration-150
                             truncate max-w-[160px]"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <svg
                    className="w-2.5 h-2.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                         M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {hostname}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
