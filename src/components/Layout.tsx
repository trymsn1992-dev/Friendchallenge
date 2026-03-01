
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Layout = () => {
    const { user } = useAuth()

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
                .then(({ data }) => {
                    // @ts-ignore
                    if (data) setAvatarUrl(data.avatar_url)
                })
        }
    }, [user])

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Floating Profile Button */}
            {user && (
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
                    <Link to="/profile" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-indigo-600 hover:scale-105 transition-transform overflow-hidden border border-gray-100">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} />
                        )}
                    </Link>
                </div>
            )}

            {/* Main content wrapper with top padding to account for floating elements if needed */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}
