import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, Calendar, User, Package } from 'lucide-react'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export function Navbar() {
    const navigate = useNavigate()
    const { role } = useAuth()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/dashboard" className="flex items-center space-x-2">
                    <Camera className="h-6 w-6 text-indigo-500" />
                    <span className="font-bold text-lg hidden sm:inline-block">PhotoBooking</span>
                </Link>
                <div className="flex items-center space-x-4">
                    {role === 'admin' && (
                        <Link to="/admin" className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span className="hidden sm:inline">Amministrazione</span>
                        </Link>
                    )}
                    <Link to="/booking" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuova Prenotazione</span>
                    </Link>
                    <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Esci">
                        <LogOut className="h-5 w-5 text-slate-400 hover:text-red-400" />
                    </Button>
                </div>
            </div>
        </nav>
    )
}
