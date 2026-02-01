
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Trophy, LogOut, PlusCircle, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Layout = () => {
    const { user } = useAuth()
    const location = useLocation()

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

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
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:bg-indigo-700 transition-colors">
                                    <Trophy size={20} />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-gray-900">
                                    Challenge<span className="text-indigo-600">Friends</span>
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <Link
                                        to="/create"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${location.pathname === '/create'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <PlusCircle size={18} />
                                        <span className="hidden sm:inline">Ny Utfordring</span>
                                    </Link>

                                    <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                                        <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-200 transition-colors overflow-hidden border border-indigo-200">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="text-gray-500 hover:text-red-600 transition-colors"
                                            title="Logg ut"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                                >
                                    Logg inn
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}
