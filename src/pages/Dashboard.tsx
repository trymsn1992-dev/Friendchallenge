import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import { Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

type Challenge = Database['public']['Tables']['challenges']['Row']

export const Dashboard = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChallenges = async () => {
            const { data, error } = await supabase
                .from('challenges')
                .select('*')
                .order('start_date', { ascending: false })

            // Wait, challenges table in schema.sql: "create table public.challenges ( ... )". I did NOT add created_at column explicitly in SQL!
            // But usually Supabase adds it? No, I must define it.
            // I used "id uuid default gen_random_uuid() primary key".
            // I should update SQL or just order by start_date.
            // Let's order by start_date for now.

            if (!error && data) {
                setChallenges(data)
            }
            setLoading(false)
        }

        fetchChallenges()
    }, [])

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
                    {challenges.map((challenge) => (
                        <Link
                            key={challenge.id}
                            to={`/challenge/${challenge.id}`}
                            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
                        >
                            <div className="mb-4">
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
                                {/* Placeholder for participant count if array is available */}
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>{challenge.participants?.length || 0} deltakere</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
