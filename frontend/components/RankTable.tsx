import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

const RANKS = [
    { name: 'Rookie', threshold: 0 },
    { name: 'Associate Executive', threshold: 15 },
    { name: 'Senior Associate', threshold: 50 },
    { name: 'Team Leader', threshold: 100 },
    { name: 'Senior Team Leader', threshold: 150 },
    { name: 'Assistant Manager', threshold: 300 },
    { name: 'Manager', threshold: 1000 },
    { name: 'Senior Manager', threshold: 5000 },
    { name: 'Regional Manager', threshold: 10000 },
    { name: 'Director', threshold: 20000 },
    { name: 'National Director', threshold: 50000 },
];

export default function RankTable({ currentPairs }: { currentPairs: number }) {
    return (
        <Card className="shadow-sm border-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
                <CardTitle>Rank requirements</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-900">Position</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Number of Pairs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {RANKS.map((rank) => {
                            const isAchieved = currentPairs >= rank.threshold;
                            return (
                                <tr
                                    key={rank.name}
                                    className={`
                                        ${isAchieved ? 'bg-emerald-50/50' : 'bg-white hover:bg-gray-50'} 
                                        transition-colors
                                    `}
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                        {isAchieved && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                        {rank.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">
                                        {rank.threshold.toLocaleString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
