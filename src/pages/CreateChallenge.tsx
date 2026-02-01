import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateChallengeDescription } from '../lib/gemini'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, ArrowRight } from 'lucide-react'

export const CreateChallenge = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal: 100,
        unit: 'pushups',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })

    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleGenerateDescription = async () => {
        if (!formData.title) return
        setGenerating(true)
        const description = await generateChallengeDescription(formData.title)
        setFormData(prev => ({ ...prev, description }))
        setGenerating(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)

        const { data, error } = await supabase
            .from('challenges')
            // @ts-ignore
            .insert({
                title: formData.title,
                description: formData.description,
                goal: Number(formData.goal),
                unit: formData.unit,
                start_date: formData.start_date,
                end_date: formData.end_date,
                creator_id: user.id,
                creator_name: user.email?.split('@')[0] || 'Anonym', // Fallback name
                participants: [user.id] // Creator is a participant
            })
            .select()
            .single()

        setSubmitting(false)

        if (error) {
            alert('Kunne ikke opprette utfordring: ' + error.message)
        } else if (data) {
            // @ts-ignore
            navigate(`/challenge/${data.id}`)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ny Utfordring</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tittel</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        placeholder="F.eks. 2000 Pushups i Februar"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse</label>
                    <div className="relative">
                        <textarea
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none min-h-[100px]"
                            placeholder="Hva går utfordringen ut på?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={generating || !formData.title}
                            className="absolute bottom-3 right-3 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                            <Sparkles size={14} />
                            {generating ? 'Tenker...' : 'Foreslå med AI'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mål (Antall)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            value={formData.goal}
                            onChange={e => setFormData({ ...formData, goal: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enhet</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            placeholder="pushups, km, sider"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Startdato</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sluttdato</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 mt-4"
                >
                    {submitting ? 'Oppretter...' : 'Start Utfordring'}
                    {!submitting && <ArrowRight size={20} />}
                </button>
            </form>
        </div>
    )
}
