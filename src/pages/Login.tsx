import { supabase } from '../lib/supabase'
import { Trophy } from 'lucide-react'

export const Login = () => {
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                    <Trophy size={32} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Velkommen tilbake</h1>
                <p className="text-gray-500 mb-8">Logg inn for å bli med i utfordringer og konkurrere med venner.</p>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all focus:ring-4 focus:ring-indigo-100"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                        className="w-5 h-5"
                    />
                    Logg inn gjennnom Google
                </button>
            </div>
        </div>
    )
}
