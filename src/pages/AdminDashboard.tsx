import React, { useEffect, useState } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarIcon, Users, Euro, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface AdminBooking {
    id: string
    status: string
    start_time: string
    end_time: string
    packages: { name: string, price: number }
    profiles: { full_name: string | null, email: string, phone: string | null }
}

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<AdminBooking[]>([])
    const [loading, setLoading] = useState(true)

    const [stats, setStats] = useState({
        totalEarnings: 0,
        pendingCount: 0,
        totalBookings: 0
    })

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                end_time,
                packages ( name, price ),
                profiles ( full_name, email, phone )
            `)
            .order('start_time', { ascending: false })

        if (error) {
            console.error(error)
        } else if (data) {
            const castedData = data as any as AdminBooking[]
            setBookings(castedData)

            // Calc stats
            let earnings = 0
            let pending = 0

            castedData.forEach(b => {
                if (b.status === 'confirmed') earnings += (b.packages?.price || 0)
                if (b.status === 'pending') pending++
            })

            setStats({
                totalEarnings: earnings,
                pendingCount: pending,
                totalBookings: castedData.length
            })
        }
        setLoading(false)
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            fetchAdminData() // refresh the table and stats
        } else {
            alert('Errore aggiornamento: ' + error.message)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Pannello Amministratore</h1>
                    <p className="text-slate-400">Pannello di controllo per gestire tutte le prenotazioni.</p>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Guadagno Stimato</CardTitle>
                            <Euro className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">€{stats.totalEarnings}</div>
                            <p className="text-xs text-slate-500 mt-1">Sulle prenotazioni confermate</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Richieste in Attesa</CardTitle>
                            <Clock className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.pendingCount}</div>
                            <p className="text-xs text-slate-500 mt-1">Da approvare</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Totale Prenotazioni</CardTitle>
                            <Users className="h-4 w-4 text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
                            <p className="text-xs text-slate-500 mt-1">Incluso annullate</p>
                        </CardContent>
                    </Card>
                </div>

                {/* TABLE */}
                <Card className="border-slate-800 bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Lista Appuntamenti</CardTitle>
                        <CardDescription>Tutte le richieste degli utenti</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : bookings.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Nessun appuntamento trovato.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Cliente</th>
                                            <th className="px-4 py-3">Servizio</th>
                                            <th className="px-4 py-3">Data e Ora</th>
                                            <th className="px-4 py-3">Stato</th>
                                            <th className="px-4 py-3 text-right rounded-tr-lg">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white">{booking.profiles?.full_name || 'Utente Sconosciuto'}</div>
                                                    <div className="text-xs text-slate-400">{booking.profiles?.email}</div>
                                                    {booking.profiles?.phone && <div className="text-xs text-slate-500">{booking.profiles.phone}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-indigo-400">{booking.packages?.name}</span>
                                                    <div className="text-xs">€{booking.packages?.price}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                                                        <span className="capitalize">{format(new Date(booking.start_time), "d MMM yyyy", { locale: it })}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                        booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "",
                                                        booking.status === 'pending' ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "",
                                                        booking.status === 'cancelled' ? "bg-red-500/10 text-red-400 ring-red-500/20" : ""
                                                    )}>
                                                        {booking.status === 'pending' ? 'In attesa' : booking.status === 'confirmed' ? 'Confermato' : 'Annullato'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {booking.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-400 text-emerald-500"
                                                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approva
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-900 hover:bg-red-500/10 hover:text-red-400 text-red-500"
                                                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" /> Rifiuta
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {booking.status !== 'pending' && (
                                                        <span className="text-xs text-slate-500 italic">Nessuna azione</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
