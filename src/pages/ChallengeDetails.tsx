import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateMotivation } from '../lib/gemini'
import { useAuth } from '../contexts/AuthContext'
import { QuickLog } from '../components/QuickLog'
import { ProgressBar } from '../components/ProgressBar'
import { Leaderboard } from '../components/Leaderboard'
import { ArrowLeft, Share2, Trash } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

// Types
type Challenge = {
    id: string
    title: string
    description: string
    goal: number
    unit: string
    participants: string[]
    creator_id: string
}

type Log = {
    user_id: string
    user_name: string
    amount: number
}

export const ChallengeDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()

    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)
    const [motivation, setMotivation] = useState<string | null>(null)
    const [shareMsg, setShareMsg] = useState('')

    const [avatars, setAvatars] = useState<Record<string, { url: string | null, name: string | null }>>({})

    const fetchAvatars = async () => {
        const userIds = [...new Set(logs.map(l => l.user_id))]
        if (userIds.length === 0) return

        // @ts-ignore
        const { data } = await supabase.from('profiles').select('id, avatar_url, full_name').in('id', userIds)
        if (data) {
            const avatarMap: Record<string, { url: string | null, name: string | null }> = {}
            data.forEach((p: any) => {
                avatarMap[p.id] = { url: p.avatar_url, name: p.full_name }
            })
            setAvatars(avatarMap)
        }
    }

    useEffect(() => {
        if (logs.length > 0) {
            fetchAvatars()
        }
    }, [logs])

    useEffect(() => {
        if (id) fetchChallengeData()

        const channel = supabase
            .channel('public:progress_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress_logs', filter: `challenge_id=eq.${id}` },
                () => {
                    fetchLogs() // Refresh logs on real-time update
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const fetchChallengeData = async () => {
        if (!id) return
        const { data: challengeData } = await supabase.from('challenges').select('*').eq('id', id).single()
        if (challengeData) {
            setChallenge(challengeData)
        }
        await fetchLogs()
        setLoading(false)
    }

    const fetchLogs = async () => {
        if (!id) return
        const { data } = await supabase.from('progress_logs').select('user_id, user_name, amount').eq('challenge_id', id)
        if (data) setLogs(data)
    }

    const handleLog = async (amount: number) => {
        if (!user || !challenge || !id) return

        // Optimistic UI? Or just wait. Let's wait for simplicity.
        // @ts-ignore
        await supabase.from('progress_logs').insert({
            challenge_id: id,
            user_id: user.id,
            user_name: user.email?.split('@')[0] || 'Anonym',
            amount: amount
        })

        // Check if user is in participants, if not add them
        if (!challenge.participants?.includes(user.id)) {
            const newParticipants = [...(challenge.participants || []), user.id]
            // @ts-ignore
            await supabase.from('challenges').update({ participants: newParticipants }).eq('id', id)
        }

        // AI Motivation
        const msg = await generateMotivation(amount, challenge.unit, challenge.title)
        setMotivation(msg)
        setTimeout(() => setMotivation(null), 8000)

        fetchLogs()
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        setShareMsg('Lenke kopiert!')
        setTimeout(() => setShareMsg(''), 3000)
    }

    const handleDelete = async () => {
        if (!challenge || !id || !user) return
        if (!window.confirm('Er du sikker på at du vil slette denne utfordringen? Alle logger vil bli borte.')) return

        // Manual cascade delete since we didn't set ON DELETE CASCADE in SQL
        // 1. Delete all progress logs
        // @ts-ignore
        await supabase.from('progress_logs').delete().eq('challenge_id', id)

        // 2. Delete the challenge
        // @ts-ignore
        const { error } = await supabase.from('challenges').delete().eq('id', id)

        if (error) {
            alert('Kunne ikke slette: ' + error.message)
        } else {
            navigate('/')
        }
    }

    if (loading) return <div className="text-center py-20">Laster...</div>
    if (!challenge) return <div className="text-center py-20">Fant ikke utfordringen.</div>

    // Calculate stats
    const totalProgress = logs.reduce((sum, log) => sum + log.amount, 0)
    // Shared Goal: Goal * Participants (or just fixed goal? Let's use Goal * Participants count for "Group Goal" or just Goal)
    // User Prompt: "progress-bar som viser summen av alle deltakeres innsats mot et felles gruppemål."
    // I will assume the "goal" in DB is the target per person, so group goal is goal * participants.
    // Or if goal is massive (2000 pushups in feb), maybe that's per person.
    // Let's assume GroupGoal = challenge.goal * num_participants.
    const numParticipants = new Set(logs.map(l => l.user_id)).size || 1
    const groupGoal = challenge.goal * numParticipants



    const leaderboardData = logs.reduce((acc, log) => {
        const existing = acc.find(e => e.userId === log.user_id)
        if (existing) {
            existing.total += log.amount
        } else {
            const profile = avatars[log.user_id]
            acc.push({
                userId: log.user_id,
                name: profile?.name || log.user_name || 'Ukjent',
                total: log.amount,
                avatar_url: profile?.url
            })
        }
        return acc
    }, [] as { userId: string, name: string, total: number, avatar_url?: string | null }[])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <Link to="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={24} className="text-gray-500" />
                </Link>
                <div className="flex gap-2">
                    {user && challenge && user.id === challenge.creator_id && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full font-medium hover:bg-red-100 transition-colors"
                            title="Slett utfordring"
                        >
                            <Trash size={18} />
                            <span className="text-sm hidden sm:inline">Slett</span>
                        </button>
                    )}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                    >
                        <Share2 size={18} />
                        <span className="text-sm">Del</span>
                    </button>
                </div>
            </div>

            {shareMsg && (
                <div className="fixed top-20 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-in fade-in slide-in-from-top-2">
                    {shareMsg}
                </div>
            )}

            {motivation && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-indigo-900 text-white p-6 rounded-3xl shadow-2xl z-50 border border-indigo-500/30 animate-in slide-in-from-bottom-5">
                    <div className="text-center">
                        <div className="text-2xl mb-2">🤖 🚀</div>
                        <p className="font-bold text-lg">"{motivation}"</p>
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{challenge.title}</h1>
                <p className="text-gray-500 max-w-xl mx-auto">{challenge.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <ProgressBar total={totalProgress} goal={groupGoal} unit={challenge.unit} />

                    {user ? (
                        <QuickLog onLog={handleLog} unit={challenge.unit} loading={false} />
                    ) : (
                        <div className="bg-indigo-50 p-6 rounded-3xl text-center">
                            <p className="text-indigo-800 font-medium mb-3">Logg inn for å delta!</p>
                            <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
                                Gå til to login
                            </Link>
                        </div>
                    )}
                </div>

                <Leaderboard entries={leaderboardData} unit={challenge.unit} currentUserId={user?.id} />
            </div>
        </div>
    )
}
