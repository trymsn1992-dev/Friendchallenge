import { useState } from 'react'
import { Plus } from 'lucide-react'

interface QuickLogProps {
    onLog: (amount: number) => void
    unit: string
    loading: boolean
}

export const QuickLog = ({ onLog, unit, loading }: QuickLogProps) => {
    const [customAmount, setCustomAmount] = useState('')

    const presets = [10, 25, 50, 100]

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                Logg Innsats
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {presets.map(amount => (
                    <button
                        key={amount}
                        onClick={() => onLog(amount)}
                        disabled={loading}
                        className="py-2 px-4 rounded-xl bg-gray-50 text-indigo-700 font-bold hover:bg-indigo-100 hover:scale-105 transition-all text-sm"
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
                            onLog(Number(customAmount))
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
