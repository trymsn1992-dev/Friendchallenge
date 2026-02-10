import { Medal, User as UserIcon } from 'lucide-react'

interface LeaderboardEntry {
    userId: string
    name: string
    avatar_url?: string | null
    total: number
}

interface LeaderboardProps {
    entries: LeaderboardEntry[]
    unit: string
    currentUserId?: string
    goal?: number
    expectedTotal?: number
}

export const Leaderboard = ({ entries, unit, currentUserId, goal, expectedTotal }: LeaderboardProps) => {
    const sorted = [...entries].sort((a, b) => b.total - a.total)

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Medal className="text-yellow-500" />
                Rangering
            </h3>

            <div className="space-y-4">
                {sorted.map((entry, index) => {
                    const isTop3 = index < 3
                    const isMe = entry.userId === currentUserId
                    const progress = goal ? Math.min((entry.total / goal) * 100, 100) : 0

                    const diff = expectedTotal ? entry.total - expectedTotal : 0
                    const isAhead = diff >= 0

                    return (
                        <div
                            key={entry.userId}
                            className={`flex flex-col p-4 rounded-2xl transition-all ${isMe ? 'bg-indigo-50 border border-indigo-100 ring-2 ring-indigo-200' : 'bg-gray-50 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center w-full">
                                <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mr-4 flex-shrink-0
                    ${index === 0 ? 'bg-yellow-400 text-white shadow-md' :
                                        index === 1 ? 'bg-gray-300 text-white shadow-md' :
                                            index === 2 ? 'bg-amber-600 text-white shadow-md' :
                                                'bg-gray-200 text-gray-500'}
                  `}>
                                    {index + 1}
                                </div>

                                <div className="mr-3 flex-shrink-0">
                                    {entry.avatar_url ? (
                                        <img
                                            src={entry.avatar_url}
                                            alt={entry.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400">
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="font-bold text-gray-900 flex items-center gap-2 truncate">
                                        {entry.name}
                                        {isMe && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full flex-shrink-0">Meg</span>}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-2 text-sm mt-0.5">
                                        <span className="font-medium text-gray-900">{entry.total.toLocaleString()}</span>
                                        {goal && (
                                            <span className="text-gray-400">/ {goal.toLocaleString()} {unit}</span>
                                        )}
                                    </div>
                                </div>

                                {isTop3 && (
                                    <div className="text-2xl animate-pulse ml-2 flex-shrink-0">
                                        {index === 0 && '👑'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar & Status */}
                            {goal && (
                                <div className="mt-3 w-full pl-12 space-y-1">
                                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isMe ? 'bg-indigo-500' : 'bg-green-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Ahead/Behind Indicator */}
                                    {expectedTotal && (
                                        <div className={`text-xs font-medium flex items-center gap-1 ${isAhead ? 'text-green-600' : 'text-orange-600'}`}>
                                            {isAhead ? (
                                                <>🚀 +{Math.round(diff)} foran</>
                                            ) : (
                                                <>🐢 -{Math.round(Math.abs(diff))} bak</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}

                {sorted.length === 0 && (
                    <div className="text-center text-gray-400 py-4">Ingen deltakere enda.</div>
                )}
            </div>
        </div >
    )
}
