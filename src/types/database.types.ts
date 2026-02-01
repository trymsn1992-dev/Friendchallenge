export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    bio: string | null
                    preferred_units: string[] | null
                    achievements: string[] | null
                    avatar_url: string | null
                    full_name: string | null
                }
                Insert: {
                    id: string
                    bio?: string | null
                    preferred_units?: string[] | null
                    achievements?: string[] | null
                    avatar_url?: string | null
                    full_name?: string | null
                }
                Update: {
                    id?: string
                    bio?: string | null
                    preferred_units?: string[] | null
                    achievements?: string[] | null
                    avatar_url?: string | null
                    full_name?: string | null
                }
            }
            challenges: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    goal: number
                    unit: string
                    start_date: string
                    end_date: string
                    creator_id: string
                    creator_name: string | null
                    participants: string[] | null
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    goal: number
                    unit: string
                    start_date: string
                    end_date: string
                    creator_id: string
                    creator_name?: string | null
                    participants?: string[] | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    goal?: number
                    unit?: string
                    start_date?: string
                    end_date?: string
                    creator_id?: string
                    creator_name?: string | null
                    participants?: string[] | null
                }
            }
            progress_logs: {
                Row: {
                    id: string
                    challenge_id: string
                    user_id: string
                    user_name: string | null
                    amount: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    challenge_id: string
                    user_id: string
                    user_name?: string | null
                    amount: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    challenge_id?: string
                    user_id?: string
                    user_name?: string | null
                    amount?: number
                    created_at?: string
                }
            }
        }
    }
}
