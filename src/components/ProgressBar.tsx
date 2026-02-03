

interface ProgressBarProps {
    total: number
    goal: number
    unit: string
    expectedTotal?: number
}

export const ProgressBar = ({ total, goal, unit, expectedTotal }: ProgressBarProps) => {
    const percentage = Math.min((total / goal) * 100, 100)
    const expectedPercentage = expectedTotal ? Math.min((expectedTotal / goal) * 100, 100) : 0

    const diff = expectedTotal ? total - expectedTotal : 0
    const isAhead = diff >= 0

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-end mb-2">
                <div className="z-10 relative">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Felles Fremgang</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                        {total.toLocaleString()} <span className="text-lg text-gray-400 font-normal">/ {goal.toLocaleString()} {unit}</span>
                    </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600 z-10 relative">
                    {Math.round(percentage)}%
                </div>
            </div>

            <div className="relative w-full bg-gray-100 rounded-full h-4 mt-2">
                {/* Expected progress marker */}
                {expectedTotal && (
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-gray-400 opacity-50 z-0"
                        style={{ left: `${expectedPercentage}%` }}
                    />
                )}

                {/* Actual progress bar */}
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out z-10 relative ${isAhead ? 'bg-indigo-600' : 'bg-orange-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {expectedTotal && (
                <div className={`text-sm mt-3 font-medium ${isAhead ? 'text-green-600' : 'text-orange-600'}`}>
                    {isAhead
                        ? `🚀 Dere ligger ${Math.round(diff)} ${unit} foran skjema!`
                        : `🐢 Dere ligger ${Math.round(Math.abs(diff))} ${unit} bak skjema.`
                    }
                </div>
            )}
        </div>
    )
}
