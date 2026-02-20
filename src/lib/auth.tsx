import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    role: string | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, role: null, loading: true })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                supabase.from('profiles').select('role').eq('id', session.user.id).single()
                    .then(({ data }) => {
                        if (mounted) {
                            setRole(data?.role || 'user')
                            setLoading(false)
                        }
                    })
                    .catch(() => {
                        if (mounted) {
                            setRole('user')
                            setLoading(false)
                        }
                    })
            } else {
                if (mounted) {
                    setRole(null)
                    setLoading(false)
                }
            }
        }).catch(() => {
            if (mounted) setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return

            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
            }

            if (session?.user) {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    supabase.from('profiles').select('role').eq('id', session.user.id).single()
                        .then(({ data }) => {
                            if (mounted) setRole(data?.role || 'user')
                        })
                        .catch(() => {
                            if (mounted) setRole('user')
                        })
                }
            } else {
                if (mounted) {
                    setRole(null)
                    setLoading(false)
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ session, user, role, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
