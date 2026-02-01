import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Camera, Loader2, Save } from 'lucide-react'

export const Profile = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [fullName, setFullName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        if (user) {
            getProfile()
        }
    }, [user])

    const getProfile = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('profiles')
                .select('avatar_url, full_name')
                .eq('id', user!.id)
                .single()

            if (error) {
                console.warn(error)
            } else if (data) {
                // @ts-ignore
                setAvatarUrl(data.avatar_url)
                // @ts-ignore
                if (data.full_name) setFullName(data.full_name)
            }

            setEmail(user?.email || '')
            // Default name from email if no full name set
            // @ts-ignore
            if (!data?.full_name && user?.email) {
                setFullName(user.email.split('@')[0])
            }
        } catch (error) {
            console.error('Error loading user data!', error)
        } finally {
            setLoading(false)
        }
    }

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            setMessage(null)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user!.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                // @ts-ignore
                .upsert({
                    id: user!.id,
                    avatar_url: publicUrl
                })

            if (updateError) {
                throw updateError
            }

            setAvatarUrl(publicUrl)
            setMessage({ type: 'success', text: 'Profilbildet er oppdatert!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Klarte ikke laste opp bildet.' })
        } finally {
            setUploading(false)
        }
    }

    const updateProfile = async () => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from('profiles')
                // @ts-ignore
                .upsert({
                    id: user!.id,
                    full_name: fullName,
                    updated_at: new Date()
                })

            if (error) throw error
            setMessage({ type: 'success', text: 'Profil oppdatert!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Min Profil</h1>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ${uploading ? 'opacity-50' : ''}`}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-300">
                                    <User size={64} />
                                </div>
                            )}
                        </div>

                        <label
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-indigo-700 transition-colors"
                            htmlFor="avatar-upload"
                        >
                            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                        </label>
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                        />
                    </div>

                </div>

                <div className="flex items-center gap-2 mt-4 w-full justify-center">
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="text-xl font-semibold text-gray-900 text-center bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none transition-all w-full max-w-xs"
                        placeholder="Ditt navn"
                    />
                    <button
                        onClick={updateProfile}
                        disabled={loading}
                        className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Lagre navn"
                    >
                        <Save size={20} />
                    </button>
                </div>
                <p className="text-gray-500 text-sm">{email}</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Innlogging</h3>
                    <p className="text-gray-900">Google</p>
                </div>
            </div>
        </div>

    )
}
