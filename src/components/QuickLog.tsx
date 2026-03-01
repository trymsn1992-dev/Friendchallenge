import { useState } from 'react'
import { Plus, CheckCircle, Zap } from 'lucide-react'
import type { ChallengeExercise } from '../pages/ChallengeDetails'

interface QuickLogProps {
    onLog: (amount: number, exerciseId?: string) => void
    unit: string
    loading: boolean
    exercises?: ChallengeExercise[]
    todayProgress?: Record<string, number>
}

export const QuickLog = ({ onLog, unit, loading, exercises, todayProgress }: QuickLogProps) => {
    const [customAmount, setCustomAmount] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastAmount, setLastAmount] = useState(0)
    const [lastUnit, setLastUnit] = useState(unit)

    const [clickedExId, setClickedExId] = useState<string | null>(null)
    const [clickedPreset, setClickedPreset] = useState<number | null>(null)
    const [clickedCustom, setClickedCustom] = useState(false)

    const [randomQuote, setRandomQuote] = useState('')

    const opmQuotes = [
        "If you really want to become strong… stop caring about what others think.",
        "You can’t sit around envying other people’s worlds. You have to go out and change your own.",
        "Human beings are strong because we can change ourselves.",
        "I’m just a guy who’s a hero for fun.",
        "No matter how much you try, you can’t surpass me. But you can try to surpass yourself.",
        "I will eliminate evil with overwhelming power.",
        "True strength is not something you’re born with. It’s something you build.",
        "I refuse to give up. That is the only reason I’m still standing.",
        "I know I’m not strong. But I won’t run away.",
        "It’s not about winning or losing. It’s about taking you on right here, right now!",
        "Even if I’m weak, I won’t stop fighting for what’s right.",
        "Power isn’t everything. It’s how you use it that matters."
    ]

    // For OPM: track which exercise we are manually logging for
    const [activeExercise, setActiveExercise] = useState<ChallengeExercise | null>(null)

    const presets = [10, 25, 50, 100]

    const handleLog = (amount: number, exerciseId?: string, exerciseUnit?: string) => {
        // Trigger haptic feedback if supported by the browser/device
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50) // 50ms vibration
        }

        onLog(amount, exerciseId)
        setLastAmount(amount)
        setLastUnit(exerciseUnit || unit)

        let showRandomQuote = false
        if (exercises && exercises.length > 0 && todayProgress && exerciseId) {
            const isCompletedBefore = exercises.every(ex => (todayProgress[ex.id] || 0) >= ex.daily_goal)
            const newProgress = { ...todayProgress, [exerciseId]: (todayProgress[exerciseId] || 0) + amount }
            const isCompletedAfter = exercises.every(ex => (newProgress[ex.id] || 0) >= ex.daily_goal)

            if (!isCompletedBefore && isCompletedAfter) {
                showRandomQuote = true
            }
        }

        if (showRandomQuote) {
            setRandomQuote(opmQuotes[Math.floor(Math.random() * opmQuotes.length)])
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 8000)
        } else {
            setRandomQuote('')
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2500)
        }
    }

    const handleShortClick = (exercise: ChallengeExercise) => {
        if (!loading) {
            handleLog(exercise.daily_goal, exercise.id, exercise.unit)
            setClickedExId(exercise.id)
            setTimeout(() => setClickedExId(null), 500)
        }
    }

    const startCustomLog = (e: React.MouseEvent, exercise: ChallengeExercise) => {
        e.stopPropagation() // Prevent triggering the short click
        setActiveExercise(exercise)
        setCustomAmount('')
    }


    // The success message will be rendered as a floating toast overlay
    const successToast = showSuccess ? (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-50 px-6 py-4 rounded-2xl border border-green-200 shadow-xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                <CheckCircle className="text-green-600 w-6 h-6" />
            </div>
            <div>
                <h3 className="text-base font-bold text-green-800 m-0 leading-none mb-1">Bra jobba! 🎉</h3>
                <p className="text-sm text-green-600 m-0 leading-none">
                    Logget <span className="font-bold">+{lastAmount} {lastUnit}</span>
                </p>
                {randomQuote && (
                    <p className="text-xs text-green-700 mt-2 italic border-t border-green-100 pt-1">
                        "{randomQuote}"
                    </p>
                )}
            </div>
        </div>
    ) : null;

    // --- OPM MODE RENDERING ---
    if (exercises && exercises.length > 0) {
        if (activeExercise) {
            return (
                <div className="bg-white rounded-3xl p-6 border border-yellow-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Zap className="text-yellow-500" size={20} />
                            Logg {activeExercise.name}
                        </span>
                        <button onClick={() => setActiveExercise(null)} className="text-sm border py-1 px-3 rounded text-gray-500 hover:bg-gray-50">Avbryt</button>
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder={`Antall (${activeExercise.unit})...`}
                            className="flex-grow px-4 py-2 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-50 outline-none text-sm"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            autoFocus
                        />
                        <button
                            disabled={!customAmount || loading}
                            onClick={() => {
                                if (customAmount) {
                                    handleLog(Number(customAmount), activeExercise.id, activeExercise.unit)
                                    setActiveExercise(null)
                                }
                            }}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
                        >
                            Logg
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-yellow-200 shadow-sm flex flex-col relative text-left">
                {successToast}
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    Dagens Treningsøkt
                </h3>

                <div className={`grid gap-3 ${exercises.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {exercises.map(ex => (
                        <div key={ex.id} className="relative group flex">
                            <button
                                onClick={() => handleShortClick(ex)}
                                disabled={loading}
                                className={`flex-grow py-3 px-3 rounded-l-xl border-y border-l transition-all text-left flex flex-col justify-center ${clickedExId === ex.id
                                    ? 'bg-yellow-200 border-yellow-400 scale-[0.98] shadow-inner'
                                    : 'bg-gray-50 border-gray-100 hover:bg-yellow-50 hover:border-yellow-200'
                                    }`}
                            >
                                <span className="text-sm font-bold text-gray-800">{ex.name}</span>
                                <span className="text-xs text-gray-500">+{ex.daily_goal} {ex.unit}</span>
                            </button>
                            <button
                                onClick={(e) => startCustomLog(e, ex)}
                                disabled={loading}
                                className="w-10 rounded-r-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                title="Annet beløp"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">Tapp for å logge dagsmål, eller + for annet beløp.</p>
            </div>
        )
    }

    // --- STANDARD MODE RENDERING ---
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col relative text-left">
            {successToast}
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                Logg Innsats
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 flex-grow">
                {presets.map(amount => (
                    <button
                        key={amount}
                        onClick={() => {
                            handleLog(amount)
                            setClickedPreset(amount)
                            setTimeout(() => setClickedPreset(null), 500)
                        }}
                        disabled={loading}
                        className={`py-2 px-4 rounded-xl font-bold transition-all text-sm h-full flex items-center justify-center ${clickedPreset === amount
                            ? 'bg-indigo-300 text-indigo-900 scale-95 shadow-inner'
                            : 'bg-gray-50 text-indigo-700 hover:bg-indigo-100 hover:scale-105'
                            }`}
                    >
                        +{amount}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder={`Annet antall (${unit})...`}
                    className="flex-grow px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                />
                <button
                    disabled={!customAmount || loading}
                    onClick={() => {
                        if (customAmount) {
                            handleLog(Number(customAmount))
                            setCustomAmount('')
                            setClickedCustom(true)
                            setTimeout(() => setClickedCustom(false), 500)
                        }
                    }}
                    className={`text-white px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 ${clickedCustom
                        ? 'bg-indigo-800 scale-95 shadow-inner'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    Logg
                </button>
            </div>
        </div>
    )
}
