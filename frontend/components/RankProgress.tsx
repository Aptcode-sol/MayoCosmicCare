import { Card, CardContent } from "@/components/ui/Card"

const RANKS = [
    { name: 'Rookie', threshold: 0, colors: { from: 'from-gray-100', to: 'to-gray-200', text: 'text-gray-800', accent: 'bg-gray-300', label: 'text-gray-600', badge: 'bg-gray-200/50 border-gray-300/30' } },
    { name: 'Associate Executive', threshold: 15, colors: { from: 'from-blue-400', to: 'to-blue-600', text: 'text-white', accent: 'bg-blue-300', label: 'text-blue-100', badge: 'bg-blue-500/30 border-blue-400/20' } },
    { name: 'Senior Associate', threshold: 50, colors: { from: 'from-teal-500', to: 'to-teal-700', text: 'text-white', accent: 'bg-teal-300', label: 'text-teal-100', badge: 'bg-teal-500/30 border-teal-400/20' } },
    { name: 'Team Leader', threshold: 100, colors: { from: 'from-emerald-500', to: 'to-emerald-700', text: 'text-white', accent: 'bg-emerald-300', label: 'text-emerald-100', badge: 'bg-emerald-500/30 border-emerald-400/20' } },
    { name: 'Senior Team Leader', threshold: 150, colors: { from: 'from-indigo-500', to: 'to-indigo-700', text: 'text-white', accent: 'bg-indigo-300', label: 'text-indigo-100', badge: 'bg-indigo-500/30 border-indigo-400/20' } },
    { name: 'Assistant Manager', threshold: 300, colors: { from: 'from-violet-500', to: 'to-violet-700', text: 'text-white', accent: 'bg-violet-300', label: 'text-violet-100', badge: 'bg-violet-500/30 border-violet-400/20' } },
    { name: 'Manager', threshold: 1000, colors: { from: 'from-purple-600', to: 'to-purple-800', text: 'text-white', accent: 'bg-purple-300', label: 'text-purple-100', badge: 'bg-purple-500/30 border-purple-400/20' } },
    { name: 'Senior Manager', threshold: 5000, colors: { from: 'from-fuchsia-600', to: 'to-fuchsia-800', text: 'text-white', accent: 'bg-fuchsia-300', label: 'text-fuchsia-100', badge: 'bg-fuchsia-500/30 border-fuchsia-400/20' } },
    { name: 'Regional Manager', threshold: 10000, colors: { from: 'from-rose-600', to: 'to-rose-800', text: 'text-white', accent: 'bg-rose-300', label: 'text-rose-100', badge: 'bg-rose-500/30 border-rose-400/20' } },
    { name: 'Director', threshold: 20000, colors: { from: 'from-orange-500', to: 'to-red-600', text: 'text-white', accent: 'bg-orange-300', label: 'text-orange-100', badge: 'bg-orange-500/30 border-orange-400/20' } },
    { name: 'National Director', threshold: 50000, colors: { from: 'from-amber-400', to: 'to-yellow-500', text: 'text-amber-900', accent: 'bg-amber-600', label: 'text-amber-800', badge: 'bg-amber-500/30 border-amber-400/30' } },
];

export default function RankProgress({ currentRank, totalPairs }: { currentRank: string, totalPairs: number }) {
    // Find current rank index
    const currentRankIndex = RANKS.findIndex(r => r.name === currentRank);
    const rankIndex = currentRankIndex !== -1 ? currentRankIndex : 0;
    const currentRankObj = RANKS[rankIndex];
    const nextRank = rankIndex < RANKS.length - 1 ? RANKS[rankIndex + 1] : null;

    // Calculate progress
    let progress = 100;
    let pairsNeeded = 0;

    if (nextRank) {
        const range = nextRank.threshold - currentRankObj.threshold;
        const currentInStep = totalPairs - currentRankObj.threshold;
        progress = Math.min(100, Math.max(0, (currentInStep / range) * 100));
        pairsNeeded = nextRank.threshold - totalPairs;
    }

    const colors = currentRankObj.colors;

    return (
        <Card className={`shadow-lg border-0 relative overflow-hidden bg-gradient-to-br ${colors.from} ${colors.to} ${colors.text}`}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
            </div>

            <CardContent className="p-4 md:p-5 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 w-full md:w-auto">
                        <p className={`${colors.label} text-xs font-semibold uppercase tracking-wider mb-1`}>Current Rank</p>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">{currentRank || 'Rookie'}</h3>
                        <div className={`inline-flex items-center gap-2 ${colors.badge} px-3 py-1 rounded-full text-xs backdrop-blur-sm border`}>
                            <span className={colors.label}>Total Pairs:</span>
                            <span className="font-semibold">{totalPairs}</span>
                        </div>
                    </div>

                    {nextRank && (
                        <div className="md:ml-6 flex-1 w-full md:w-auto">
                            <div className="flex justify-between items-center mb-1">
                                <p className={`${colors.label} text-xs`}>Next: {nextRank.name}</p>
                                <span className="text-base md:text-lg font-bold">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 backdrop-blur-sm overflow-hidden border border-white/10">
                                <div
                                    className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className={`${colors.label} text-xs mt-1 text-right`}>{pairsNeeded} pairs to go</p>
                        </div>
                    )}

                    {!nextRank && (
                        <div className="md:ml-6 flex-1 text-center py-2 bg-white/10 rounded-lg border border-white/10">
                            <p className="font-semibold text-sm">🏆 Top Rank!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

