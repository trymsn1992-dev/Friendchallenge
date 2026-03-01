import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import { Calendar, Trash, Share2, Plus } from 'lucide-react'
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
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Utforsk Utfordringer</h1>
                <Link
                    to="/create"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Lag utfordring</span>
                </Link>
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

                        const handleShare = (e: React.MouseEvent) => {
                            e.preventDefault() // Prevent navigation to challenge details
                            const url = `${window.location.origin}/challenge/${challenge.id}`
                            if (navigator.share) {
                                navigator.share({
                                    title: challenge.title,
                                    text: `Bli med på utfordringen: ${challenge.title}`,
                                    url: url,
                                }).catch((error) => console.log('Error sharing', error))
                            } else {
                                navigator.clipboard.writeText(url)
                                alert('Link kopiert til utklippstavlen!')
                            }
                        }

                        return (
                            <div key={challenge.id} className="relative group">
                                <Link
                                    to={`/challenge/${challenge.id}`}
                                    className="block h-full bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col pt-12"
                                >
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

                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={handleShare}
                                        className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm"
                                        title="Del utfordring"
                                    >
                                        <Share2 size={16} />
                                    </button>

                                    {user && user.id === challenge.creator_id && (
                                        <button
                                            onClick={(e) => handleDelete(e, challenge.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-gray-50 rounded-full transition-colors shadow-sm"
                                            title="Slett utfordring"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
                                        {challenge.unit}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
