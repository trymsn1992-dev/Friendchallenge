import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import { Calendar, Trash } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'

type Challenge = Database['public']['Tables']['challenges']['Row']

export const Dashboard = () => {
    const { user } = useAuth() // Get current user
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)
    const [avatars, setAvatars] = useState<Record<string, string | null>>({})

    useEffect(() => {
        fetchChallenges()
    }, [])

    const fetchChallenges = async () => {
        const { data: challengesData, error } = await supabase
            .from('challenges')
            .select('*')
            .order('start_date', { ascending: false })

        if (!error && challengesData) {
            setChallenges(challengesData)

            // Extract all participant IDs
            const userIds = [...new Set((challengesData as Challenge[]).flatMap(c => c.participants || []))]

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, avatar_url')
                    .in('id', userIds)

                if (profilesData) {
                    const avatarMap: Record<string, string | null> = {}
                    profilesData.forEach((p: any) => {
                        avatarMap[p.id] = p.avatar_url
                    })
                    setAvatars(avatarMap)
                }
            }
        }
        setLoading(false)
    }

    const handleDelete = async (e: React.MouseEvent, challengeId: string) => {
        e.preventDefault() // Prevent navigation
        if (!user) return
        if (!window.confirm('Er du sikker på at du vil slette denne utfordringen?')) return

        // 1. Delete challenge (logs deleted by cascade in DB)
        // @ts-ignore
        const { error } = await supabase.from('challenges').delete().eq('id', challengeId)

        if (error) {
            alert('Kunne ikke slette: ' + error.message)
        } else {
            // Refresh list
            setChallenges(prev => prev.filter(c => c.id !== challengeId))
        }
    }

    if (loading) return <div className="text-center py-10 text-gray-500">Laster utfordringer...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Utforsk Utfordringer</h1>
            </div>

            {challenges.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg mb-4">Ingen aktive utfordringer akkurat nå.</p>
                    <Link to="/create" className="text-indigo-600 font-medium hover:underline">
                        Lag den første!
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((challenge) => {
                        const participants = challenge.participants || []
                        const displayParticipants = participants.slice(0, 3)

                        return (
                            <div key={challenge.id} className="relative group">
                                <Link
                                    to={`/challenge/${challenge.id}`}
                                    className="block h-full bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    <div className="mb-4 flex justify-between items-start">
                                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
                                            {challenge.unit}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {challenge.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-3">
                                        {challenge.description}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-gray-400 mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{format(new Date(challenge.end_date), 'd. MMM')}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {displayParticipants.map(pid => (
                                                    <div key={pid} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                                        {avatars[pid] ? (
                                                            <img src={avatars[pid]!} alt="Deltaker" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[10px] text-indigo-600 font-bold">
                                                                ?
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <span>{participants.length} deltakere</span>
                                        </div>
                                    </div>
                                </Link>

                                {user && user.id === challenge.creator_id && (
                                    <button
                                        onClick={(e) => handleDelete(e, challenge.id)}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Slett utfordring"
                                    >
                                        <Trash size={18} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
