import { useState } from 'react'
import { Medal, User as UserIcon, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

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
    logs?: any[]
    exercises?: any[]
    isOpm?: boolean
}

export const Leaderboard = ({
    entries,
    unit,
    currentUserId,
    goal,
    expectedTotal,
    logs = [],
    exercises = [],
    isOpm = false
}: LeaderboardProps) => {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
    const sorted = [...entries].sort((a, b) => b.total - a.total)

    const toggleExpand = (userId: string) => {
        setExpandedUserId(expandedUserId === userId ? null : userId)
    }

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
                    const isExpanded = expandedUserId === entry.userId

                    const diff = expectedTotal ? entry.total - expectedTotal : 0
                    const isAhead = diff >= 0

                    return (
                        <div
                            key={entry.userId}
                            onClick={() => toggleExpand(entry.userId)}
                            className={`flex flex-col p-4 rounded-3xl transition-all duration-300 cursor-pointer ${isMe
                                ? 'bg-indigo-50/50 border border-indigo-100 shadow-sm ring-1 ring-indigo-200/50'
                                : 'bg-gray-50/50 border border-transparent hover:bg-gray-100/50'
                                } ${isExpanded ? 'shadow-md scale-[1.01] bg-white border-indigo-100' : ''}`}
                        >
                            <div className="flex items-center w-full">
                                <div className={`
                                    w-8 h-8 flex items-center justify-center rounded-full font-black text-xs mr-4 flex-shrink-0 shadow-sm
                                    ${index === 0 ? 'bg-yellow-400 text-white' :
                                        index === 1 ? 'bg-gray-300 text-white' :
                                            index === 2 ? 'bg-orange-400 text-white' :
                                                'bg-white text-gray-400 border border-gray-100'}
                                `}>
                                    {index + 1}
                                </div>

                                <div className="mr-3 flex-shrink-0">
                                    {entry.avatar_url ? (
                                        <img
                                            src={entry.avatar_url}
                                            alt={entry.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400 border-2 border-white shadow-sm">
                                            <UserIcon size={18} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="font-bold text-gray-900 flex items-center gap-2 truncate">
                                        <span className="truncate text-sm">{entry.name}</span>
                                        {isMe && <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Meg</span>}
                                        {isTop3 && (
                                            <span className="text-lg flex-shrink-0">
                                                {index === 0 && '👑'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs mt-0.5 text-gray-500">
                                        <span className="font-bold text-gray-900">{entry.total.toLocaleString()}</span>
                                        {goal && !isOpm && (
                                            <span className="opacity-60">/ {goal.toLocaleString()} {unit}</span>
                                        )}
                                        {isOpm && <span className="opacity-60 text-[10px] font-medium uppercase tracking-tighter">Saitama poeng</span>}
                                    </div>
                                </div>

                                <div className="text-gray-300 ml-2">
                                    {isExpanded ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Progress Bar (Standard only) */}
                            {goal && !isOpm && (
                                <div className="mt-3 w-full pl-12 space-y-1">
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isMe ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {expectedTotal && (
                                        <div className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-tight ${isAhead ? 'text-emerald-600' : 'text-orange-600'}`}>
                                            {isAhead ? (
                                                <>🚀 +{Math.round(diff)} foran</>
                                            ) : (
                                                <>🐢 -{Math.round(Math.abs(diff))} bak</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 opacity-70">
                                        <TrendingUp size={12} />
                                        Detaljert oversikt
                                    </h4>

                                    {exercises.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {exercises.map(ex => {
                                                const userTotal = logs
                                                    .filter(l => l.user_id === entry.userId && l.exercise_id === ex.id)
                                                    .reduce((sum, l) => sum + l.amount, 0)

                                                return (
                                                    <div key={ex.id} className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100/50">
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-0.5">{ex.name}</div>
                                                        <div className="font-black text-gray-900 text-lg leading-tight">
                                                            {userTotal.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium lowercase italic">{ex.unit}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100/50">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Totalt logget</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-indigo-600 text-2xl leading-none">{entry.total.toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{unit}</span>
                                                </div>
                                            </div>
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
