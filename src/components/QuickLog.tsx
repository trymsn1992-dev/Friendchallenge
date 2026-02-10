import { useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'

interface QuickLogProps {
    onLog: (amount: number) => void
    unit: string
    loading: boolean
}

export const QuickLog = ({ onLog, unit, loading }: QuickLogProps) => {
    const [customAmount, setCustomAmount] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastAmount, setLastAmount] = useState(0)

    const presets = [10, 25, 50, 100]

    const handleLog = (amount: number) => {
        onLog(amount)
        setLastAmount(amount)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
    }

    if (showSuccess) {
        return (
            <div className="bg-green-50 rounded-3xl p-6 border border-green-100 shadow-sm flex flex-col items-center justify-center text-center h-[180px] animate-in fade-in zoom-in">
                <div className="bg-green-100 p-3 rounded-full mb-2">
                    <CheckCircle className="text-green-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-800">Bra jobba! 🎉</h3>
                <p className="text-green-600">
                    Logget <span className="font-bold">+{lastAmount} {unit}</span>
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                Logg Innsats
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 flex-grow">
                {presets.map(amount => (
                    <button
                        key={amount}
                        onClick={() => handleLog(amount)}
                        disabled={loading}
                        className="py-2 px-4 rounded-xl bg-gray-50 text-indigo-700 font-bold hover:bg-indigo-100 hover:scale-105 transition-all text-sm h-full flex items-center justify-center"
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
                        }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    Logg
                </button>
            </div>
        </div>
    )
}
