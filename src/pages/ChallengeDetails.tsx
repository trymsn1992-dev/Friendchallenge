import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuickLog } from '../components/QuickLog'
import { ProgressBar } from '../components/ProgressBar'
import { Leaderboard } from '../components/Leaderboard'
import { ArrowLeft, Heart, Pencil, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Database } from '../types/database.types'

import { format } from 'date-fns'

// Types
type Challenge = Database['public']['Tables']['challenges']['Row']
export type ChallengeExercise = Database['public']['Tables']['challenge_exercises']['Row']

export type Log = {
    id: string
    user_id: string
    user_name: string
    amount: number
    created_at?: string
    likes_count?: number
    exercise_id?: string
}

export const ChallengeDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()

    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [exercises, setExercises] = useState<ChallengeExercise[]>([])
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [saving, setSaving] = useState(false)

    const [avatars, setAvatars] = useState<Record<string, { url: string | null, name: string | null }>>({})
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set())

    const [showStravaModal, setShowStravaModal] = useState(false)
    const [stravaActivities, setStravaActivities] = useState<any[]>([])
    const [loadingStrava, setLoadingStrava] = useState(false)

    const fetchAvatars = async () => {
        const userIds = [...new Set([
            ...logs.map(l => l.user_id),
            ...(challenge?.participants || [])
        ])]
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
        fetchAvatars()
    }, [logs, challenge?.participants])

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

    useEffect(() => {
        if (showStravaModal) {
            fetchStravaActivities()
        }
    }, [showStravaModal])

    const fetchChallengeData = async () => {
        if (!id) return
        const { data: challengeData } = await supabase.from('challenges').select('*').eq('id', id).single()
        if (challengeData) {
            setChallenge(challengeData as unknown as Challenge)

            if ((challengeData as any).is_opm) {
                const { data: exData } = await supabase
                    .from('challenge_exercises')
                    .select('*')
                    .eq('challenge_id', id)

                if (exData) {
                    setExercises(exData)
                }
            }
        }
        await fetchLogs()
        setLoading(false)
    }

    const fetchLogs = async () => {
        if (!id) return

        // Fetch logs
        const { data: logsData } = await supabase
            .from('progress_logs')
            .select('id, user_id, user_name, amount, created_at, exercise_id')
            .eq('challenge_id', id)
            .order('created_at', { ascending: false })

        const logs = logsData as any[] | null

        if (logs) {
            // Fetch likes count for these logs
            const logIds = logs.map(l => l.id)

            if (logIds.length > 0) {
                // Get all likes for these logs
                const { data: likesResult } = await supabase
                    .from('likes')
                    .select('log_id, user_id')
                    .in('log_id', logIds)

                const likesData = likesResult as any[] | null

                // Map likes to logs
                const logsWithLikes = logs.map(log => {
                    const likes = likesData?.filter(l => l.log_id === log.id) || []
                    return {
                        ...log,
                        likes_count: likes.length
                    }
                })

                setLogs(logsWithLikes)

                // Set user likes
                if (user) {
                    const myLikes = new Set(likesData?.filter(l => l.user_id === user.id).map(l => l.log_id))
                    setUserLikes(myLikes)
                }
            } else {
                setLogs(logs.map(l => ({ ...l, likes_count: 0 })))
            }
        }
    }

    const handleLike = async (logId: string, isLiked: boolean) => {
        if (!user) return

        // Optimistic update
        setLogs(prev => prev.map(log => {
            if (log.id === logId) {
                return {
                    ...log,
                    likes_count: (log.likes_count || 0) + (isLiked ? -1 : 1)
                }
            }
            return log
        }))

        setUserLikes(prev => {
            const next = new Set(prev)
            if (isLiked) next.delete(logId)
            else next.add(logId)
            return next
        })

        if (isLiked) {
            await supabase.from('likes').delete().eq('log_id', logId).eq('user_id', user.id)
        } else {
            // @ts-ignore
            await supabase.from('likes').insert({ log_id: logId, user_id: user.id })
        }

        // Optional: refetch to be sure
        // fetchLogs() 
    }

    const handleSave = async () => {
        if (!challenge || !id) return
        if (!editTitle.trim()) {
            alert("Tittel kan ikke være tom.")
            return
        }

        setSaving(true)
        const { error } = await (supabase as any)
            .from('challenges')
            .update({
                title: editTitle,
                description: editDescription
            })
            .eq('id', id)

        if (error) {
            alert('Kunne ikke lagre endringer: ' + error.message)
        } else {
            setChallenge(prev => prev ? { ...prev, title: editTitle, description: editDescription } : null)
            setIsEditing(false)
        }
        setSaving(false)
    }

    const startEditing = () => {
        if (!challenge) return
        setEditTitle(challenge.title)
        setEditDescription(challenge.description || '')
        setIsEditing(true)
    }

    const handleJoin = async () => {
        if (!user || !challenge || !id) return

        try {
            const newParticipants = [...(challenge.participants || []), user.id]
            // @ts-ignore
            const { error } = await supabase.from('challenges').update({ participants: newParticipants }).eq('id', id)

            if (error) throw error

            setChallenge({ ...challenge, participants: newParticipants })
        } catch (error: any) {
            console.error('Error joining challenge:', error)
            alert('Kunne ikke bli med i utfordringen: ' + error.message)
        }
    }

    const handleLog = async (amount: number, exerciseId?: string) => {
        if (!user || !challenge || !id) return

        // Optimistic UI? Or just wait. Let's wait for simplicity.
        // @ts-ignore
        await supabase.from('progress_logs').insert({
            challenge_id: id,
            user_id: user.id,
            user_name: user.email?.split('@')[0] || 'Anonym',
            amount: amount,
            exercise_id: exerciseId || null
        })

        // Check if user is in participants, if not add them
        if (!challenge.participants?.includes(user.id)) {
            const newParticipants = [...(challenge.participants || []), user.id]
            // @ts-ignore
            await supabase.from('challenges').update({ participants: newParticipants }).eq('id', id)
        }

        // AI Motivation removed per user request
        // const msg = await generateMotivation(amount, challenge.unit, challenge.title)
        // setMotivation(msg)
        // setTimeout(() => setMotivation(null), 8000)

        fetchLogs()
    }

    // Share and Delete functionality moved to Dashboard

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

    // Calculate expected progress
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)
    const today = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = today.getTime() - startDate.getTime()

    let expectedRatio = 0
    if (totalDuration > 0) {
        expectedRatio = Math.min(Math.max(elapsed / totalDuration, 0), 1)
    }
    const expectedTotal = groupGoal * expectedRatio


    // Calculate user's today progress for OPM
    const todayStr = new Date().toISOString().split('T')[0]
    const userTodayProgress: Record<string, number> = {}
    if (challenge.is_opm && user) {
        logs.filter(l => l.user_id === user.id && (l.created_at ? l.created_at.split('T')[0] : todayStr) === todayStr)
            .forEach(log => {
                const exId = log.exercise_id || 'unknown'
                userTodayProgress[exId] = (userTodayProgress[exId] || 0) + log.amount
            })
    }

    const leaderboardData = challenge.is_opm ?
        // OPM Logic: Saitama Points
        (() => {
            // Group by user -> date -> exercise -> amount
            const userDailyProgress: Record<string, Record<string, Record<string, number>>> = {}

            logs.forEach(log => {
                const dateKey = log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
                const exId = log.exercise_id || 'unknown'

                if (!userDailyProgress[log.user_id]) userDailyProgress[log.user_id] = {}
                if (!userDailyProgress[log.user_id][dateKey]) userDailyProgress[log.user_id][dateKey] = {}
                if (!userDailyProgress[log.user_id][dateKey][exId]) userDailyProgress[log.user_id][dateKey][exId] = 0

                userDailyProgress[log.user_id][dateKey][exId] += log.amount
            })

            const requiredExercises = exercises.length

            return Object.entries(userDailyProgress).map(([userId, days]) => {
                let saitamaPoints = 0

                Object.values(days).forEach(dayExercises => {
                    let exercisesMet = 0
                    exercises.forEach(ex => {
                        if ((dayExercises[ex.id] || 0) >= ex.daily_goal) {
                            exercisesMet++
                        }
                    })
                    // 1 point if ALL exercises met their daily goal
                    if (exercisesMet === requiredExercises && requiredExercises > 0) {
                        saitamaPoints++
                    }
                })

                const profile = avatars[userId]
                return {
                    userId,
                    name: profile?.name || logs.find(l => l.user_id === userId)?.user_name || 'Ukjent',
                    total: saitamaPoints,
                    avatar_url: profile?.url
                }
            })
        })()
        :
        // Standard Logic
        logs.reduce((acc, log) => {
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

    const finalLeaderboardData = [...leaderboardData]
    const participantIdsInBoard = new Set(finalLeaderboardData.map(e => e.userId))
    challenge.participants?.forEach(pid => {
        if (!participantIdsInBoard.has(pid)) {
            const profile = avatars[pid]
            finalLeaderboardData.push({
                userId: pid,
                name: profile?.name || 'Ukjent',
                total: 0,
                avatar_url: profile?.url
            })
        }
    })

    const fetchStravaActivities = async () => {
        if (!user) return
        setLoadingStrava(true)
        try {
            const response = await fetch('/api/strava-activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            })
            const data = await response.json()
            if (data.error) throw new Error(data.error)
            setStravaActivities(data)
        } catch (error) {
            console.error('Failed to fetch Strava activities', error)
            alert('Kunne ikke hente aktiviteter fra Strava. Er du koblet til i profilen?')
        } finally {
            setLoadingStrava(false)
        }
    }



    const handleImportStrava = async (activity: any) => {
        // Convert distance/time to unit? 
        // Simple heuristic: 
        // 'km' -> distance / 1000
        // 'mil' -> distance / 10000
        // 'meter' -> distance
        // 'minutter' -> moving_time / 60

        let amount = 0
        const unit = challenge?.unit?.toLowerCase() || ''

        if (['km', 'kilometer'].includes(unit)) {
            amount = Math.round((activity.distance / 1000) * 10) / 10
        } else if (['mil'].includes(unit)) {
            amount = Math.round((activity.distance / 10000) * 10) / 10
        } else if (['m', 'meter'].includes(unit)) {
            amount = Math.floor(activity.distance)
        } else if (['min', 'minutter', 'timer'].includes(unit)) {
            // Default to minutes for time based
            amount = Math.floor(activity.moving_time / 60)
        } else {
            // Fallback to km if unknown distance unit, or just 1 for "workouts"
            amount = Math.round((activity.distance / 1000) * 10) / 10
        }

        if (confirm(`Vil du logge "${activity.name}" som ${amount} ${challenge?.unit}?`)) {
            await handleLog(amount)
            setShowStravaModal(false)
        }
    }

    return (
        <div className="pb-6 relative">
            {/* Floating Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Link to="/" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:scale-105 transition-transform overflow-hidden border border-gray-100">
                    <ArrowLeft size={24} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {!challenge.is_opm && (
                        <ProgressBar
                            total={totalProgress}
                            goal={groupGoal}
                            unit={challenge.unit}
                            expectedTotal={expectedTotal}
                            title={challenge.title}
                            description={challenge.description || undefined}
                        />
                    )}

                    {(challenge.image_url || challenge.is_opm) ? (
                        <div className="bg-indigo-600 rounded-3xl text-white shadow-lg relative overflow-hidden h-48 sm:h-64 flex flex-col justify-end p-6">
                            <img
                                src={challenge.image_url || "/opm-banner.jpg?v=3"}
                                alt={challenge.title}
                                className="absolute inset-0 w-full h-full object-cover z-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10 w-full">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-white font-black italic tracking-tight uppercase text-2xl w-full focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="Challenge Tittel"
                                    />
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black italic tracking-tight uppercase text-white shadow-sm line-clamp-1">
                                            {challenge.title}
                                        </h2>
                                        {(() => {
                                            const now = new Date()
                                            const start = new Date(challenge.start_date)
                                            const end = new Date(challenge.end_date)
                                            let status = { label: 'Live', color: 'bg-green-500/80 text-white border-green-400' }
                                            if (now < start) status = { label: 'Kommende', color: 'bg-blue-500/80 text-white border-blue-400' }
                                            else if (now > end) status = { label: 'Ferdig', color: 'bg-gray-500/80 text-white border-gray-400' }

                                            return (
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            )
                                        })()}
                                    </>
                                )}

                                {user && user.id === challenge.creator_id && !isEditing && (
                                    <button
                                        onClick={startEditing}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white ml-auto"
                                        title="Rediger utfordring"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                )}

                                {isEditing && (
                                    <div className="flex gap-2 ml-auto">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="p-2 rounded-full bg-green-500 hover:bg-green-600 transition-colors text-white shadow-lg disabled:opacity-50"
                                            title="Lagre"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white shadow-lg"
                                            title="Avbryt"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-white font-medium w-full h-24 focus:outline-none focus:ring-2 focus:ring-white/50 relative z-10"
                                    placeholder="Challenge Beskrivelse"
                                />
                            ) : (
                                <p className="text-gray-100 font-medium relative z-10 line-clamp-2 text-sm opacity-90">
                                    {challenge.description || (challenge.is_opm ? "100 Pushups. 100 Situps. 100 Squats. 10km Run. Every single day." : "")}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="h-4 w-full" />
                    )}

                    {user ? (
                        challenge.participants?.includes(user.id) ? (
                            <div className="space-y-6">
                                <QuickLog
                                    onLog={handleLog}
                                    unit={challenge.unit}
                                    loading={false}
                                    exercises={challenge.is_opm ? exercises : undefined}
                                    todayProgress={userTodayProgress}
                                />
                            </div>
                        ) : (
                            <div className="bg-indigo-50 p-6 rounded-3xl text-center">
                                <p className="text-indigo-800 font-medium mb-3">Du er ikke med i denne utfordringen ennå.</p>
                                <button onClick={handleJoin} className="inline-block bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-6 py-2 rounded-xl text-sm font-bold">
                                    Bli med!
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="bg-indigo-50 p-6 rounded-3xl text-center">
                            <p className="text-indigo-800 font-medium mb-3">Logg inn for å delta!</p>
                            <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
                                Logg inn for å bli med
                            </Link>
                        </div>
                    )}
                </div>

                <Leaderboard
                    entries={finalLeaderboardData}
                    unit={challenge.unit}
                    currentUserId={user?.id}
                    goal={challenge.goal}
                    expectedTotal={challenge.goal * expectedRatio}
                    logs={logs}
                    exercises={exercises}
                    isOpm={challenge.is_opm ?? undefined}
                />

                {/* Recent Activity Section */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Nylig aktivitet</h3>

                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-sm">Ingen aktivitet ennå.</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log, index) => {
                                const profile = avatars[log.user_id]
                                const isLiked = userLikes.has(log.id)
                                return (
                                    <div key={log.id || index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                {profile?.url ? (
                                                    <img src={profile.url} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                                                        {profile?.name?.charAt(0) || log.user_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {profile?.name || log.user_name || 'Anonym'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {log.created_at ? format(new Date(log.created_at), 'd. MMM HH:mm') : 'Nylig'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-indigo-600 font-bold">+{log.amount}</span>
                                                <span className="text-xs text-gray-400 ml-1">
                                                    {challenge.is_opm && log.exercise_id
                                                        ? exercises.find(ex => ex.id === log.exercise_id)?.name || challenge.unit
                                                        : challenge.unit}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleLike(log.id, isLiked)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium ${isLiked ? 'bg-pink-50 text-pink-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                            >
                                                <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                                                <span>{log.likes_count || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Strava Modal */}
            {
                showStravaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowStravaModal(false)}>
                        <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span>🏃‍♂️</span> Velg aktivitet
                                </h3>
                                <button onClick={() => setShowStravaModal(false)} className="text-gray-400 hover:text-gray-600">
                                    Lukk
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 space-y-3">
                                {loadingStrava ? (
                                    <div className="py-10 text-center text-gray-500">Henter dine turer... ⏳</div>
                                ) : stravaActivities.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500">
                                        Fant ingen aktiviteter siste 30 dager. 🤷‍♂️
                                        <br /><span className="text-xs opacity-75">Sjekk at du har løpt litt!</span>
                                    </div>
                                ) : (
                                    stravaActivities.map(activity => (
                                        <button
                                            key={activity.id}
                                            onClick={() => handleImportStrava(activity)}
                                            className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-[#FC4C02] hover:bg-orange-50 transition-all group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-900 group-hover:text-[#FC4C02]">{activity.name}</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(activity.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 flex gap-4">
                                                <span>📏 {(activity.distance / 1000).toFixed(2)} km</span>
                                                <span>⏱️ {Math.floor(activity.moving_time / 60)} min</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
