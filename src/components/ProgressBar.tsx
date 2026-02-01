

interface ProgressBarProps {
    total: number
    goal: number
    unit: string
}

export const ProgressBar = ({ total, goal, unit }: ProgressBarProps) => {
    const percentage = Math.min((total / goal) * 100, 100)

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Felles Fremgang</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                        {total.toLocaleString()} <span className="text-lg text-gray-400 font-normal">/ {goal.toLocaleString()} {unit}</span>
                    </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(percentage)}%
                </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
