import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateChallengeDescription } from '../lib/gemini'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, ArrowRight, Zap, ArrowLeft, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export const CreateChallenge = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [isOpmMode, setIsOpmMode] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal: 100,
        unit: 'pushups',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })

    const [opmExercises, setOpmExercises] = useState([
        { id: 'pushups', name: 'Pushups', daily_goal: 100, unit: 'reps', active: true },
        { id: 'situps', name: 'Situps', daily_goal: 100, unit: 'reps', active: true },
        { id: 'squats', name: 'Squats', daily_goal: 100, unit: 'reps', active: true },
        { id: 'running', name: 'Løping', daily_goal: 10, unit: 'km', active: true },
    ])

    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const handleGenerateDescription = async () => {
        if (!formData.title) return
        setGenerating(true)
        const description = await generateChallengeDescription(formData.title)
        setFormData(prev => ({ ...prev, description }))
        setGenerating(false)
    }

    const toggleOpmMode = () => {
        setIsOpmMode(!isOpmMode)
        if (!isOpmMode) {
            setFormData(prev => ({
                ...prev,
                title: prev.title || 'One Punch Man Challenge',
                goal: 1, // Placeholder for DB constraint
                unit: 'dager', // Placeholder
            }))
        }
    }

    const toggleExercise = (id: string) => {
        setOpmExercises(prev => prev.map(ex =>
            ex.id === id ? { ...ex, active: !ex.active } : ex
        ))
    }

    const updateExerciseGoal = (id: string, goal: number) => {
        setOpmExercises(prev => prev.map(ex =>
            ex.id === id ? { ...ex, daily_goal: goal } : ex
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (isOpmMode && !opmExercises.some(ex => ex.active)) {
            alert("Du må velge minst én øvelse for One Punch Man modusen.")
            return
        }

        setSubmitting(true)

        let uploadedImageUrl = null

        // 0. Upload image if exists
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `challenge-banners/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('challenge-images')
                .upload(filePath, imageFile)

            if (uploadError) {
                console.error('Error uploading image:', uploadError)
                alert('Kunne ikke laste opp bilde: ' + uploadError.message)
                // Continue without image or stop? Let's stop to be safe
                setSubmitting(false)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('challenge-images')
                .getPublicUrl(filePath)

            uploadedImageUrl = publicUrl
        }

        // 1. Create the challenge
        const { data: challengeData, error: challengeError } = await supabase
            .from('challenges')
            // @ts-ignore
            .insert({
                title: formData.title,
                description: formData.description,
                goal: isOpmMode ? 1 : Number(formData.goal), // Dummy value for OPM
                unit: isOpmMode ? 'dager' : formData.unit,
                start_date: formData.start_date,
                end_date: formData.end_date,
                creator_id: user.id,
                creator_name: user.email?.split('@')[0] || 'Anonym',
                participants: [user.id],
                is_opm: isOpmMode,
                image_url: uploadedImageUrl
            })
            .select()
            .single()

        if (challengeError) {
            setSubmitting(false)
            alert('Kunne ikke opprette utfordring: ' + challengeError.message)
            return
        }

        // 2. If OPM mode, save the active exercises
        // @ts-ignore
        const newChallengeId = challengeData?.id

        if (isOpmMode && newChallengeId) {
            const activeExercises = opmExercises.filter(ex => ex.active).map(ex => ({
                challenge_id: newChallengeId,
                name: ex.name,
                daily_goal: ex.daily_goal,
                unit: ex.unit
            }))

            const { error: exerciseError } = await supabase
                .from('challenge_exercises')
                // @ts-ignore
                .insert(activeExercises)

            if (exerciseError) {
                console.error("Error saving exercises:", exerciseError)
                // Continue anyway, but might be inconsistent
            }
        }

        setSubmitting(false)
        navigate(`/challenge/${newChallengeId}`)
    }

    return (
        <div className="max-w-2xl mx-auto relative">
            {/* Floating Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Link to="/" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:scale-105 transition-transform overflow-hidden border border-gray-100">
                    <ArrowLeft size={24} />
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ny Utfordring</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">

                {/* OPM Mode Toggle */}
                <button
                    type="button"
                    onClick={toggleOpmMode}
                    className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${isOpmMode
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                        : 'border-gray-200 hover:border-indigo-200 text-gray-600'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOpmMode ? 'bg-yellow-400 text-white' : 'bg-gray-100'}`}>
                            <Zap size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold">One Punch Man Modus</h3>
                            <p className="text-sm opacity-80">Saitama's daglige treningsprogram (Flere øvelser)</p>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isOpmMode ? 'bg-yellow-400' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOpmMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </button>

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

                {/* Image Upload Area */}
                <div className="space-y-2 p-4 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
                    <label className="block text-sm font-bold text-indigo-900">Bakgrunnsbilde (Valgfritt)</label>

                    {imagePreview ? (
                        <div className="relative rounded-2xl overflow-hidden aspect-video border border-gray-100 shadow-sm group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="p-3 rounded-full bg-indigo-50 shadow-sm mb-3 text-indigo-400 group-hover:text-indigo-500 transition-colors">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold text-indigo-600">Klikk for å laste opp</span> eller dra og slipp
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG eller WEBP (Max 5MB)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    )}
                </div>

                {isOpmMode ? (
                    <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-2">Daglige Øvelser</h3>
                        <p className="text-sm text-gray-500 mb-4">Velg hvilke øvelser som skal være med og juster dagsmålet (standard er godkjent av Saitama).</p>

                        {opmExercises.map((ex) => (
                            <div key={ex.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200">
                                <label className="relative flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ex.active}
                                        onChange={() => toggleExercise(ex.id)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <span className={`flex-grow font-medium ${ex.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {ex.name}
                                </span>
                                {ex.active && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={ex.daily_goal}
                                            onChange={(e) => updateExerciseGoal(ex.id, Number(e.target.value))}
                                            className="w-20 px-2 py-1 text-right rounded border border-gray-300 focus:border-indigo-500 outline-none"
                                        />
                                        <span className="text-gray-500 text-sm w-10">{ex.unit}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
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
                )}


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
