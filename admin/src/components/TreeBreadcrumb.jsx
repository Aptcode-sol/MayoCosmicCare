export default function TreeBreadcrumb({ path, onNavigate, rootLabel = 'Root' }) {
    if (!path || !path.length) return null;

    return (
        <div className="flex items-center gap-1 flex-wrap text-sm">
            {path.map((entry, i) => {
                const isLast = i === path.length - 1;
                const label = i === 0 ? rootLabel : (entry.name || entry.username || 'User');
                return (
                    <div key={entry.id} className="flex items-center gap-1">
                        <button
                            onClick={() => !isLast && onNavigate(i)}
                            disabled={isLast}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${isLast
                                ? 'text-gray-900 font-medium cursor-default'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                                }`}
                        >
                            {i === 0 && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            )}
                            {label}
                        </button>
                        {!isLast && <span className="text-gray-300">›</span>}
                    </div>
                );
            })}
        </div>
    );
}
