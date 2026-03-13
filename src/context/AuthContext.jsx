import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    // Prevents duplicate fetchProfile when onAuthStateChange fires right after getSession
    const initialLoadDone = useRef(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setLoading(false)
            initialLoadDone.current = true
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Skip the first fire — getSession() already handled it
            if (!initialLoadDone.current) return
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
    }

    async function refreshProfile() {
        if (user) await fetchProfile(user.id)
    }

    async function signOut() {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
