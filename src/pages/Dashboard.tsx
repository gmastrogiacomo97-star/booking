import React, { useEffect, useState } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { CalendarIcon, Clock, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '../lib/utils'

interface Booking {
    id: string
    status: string
    start_time: string
    end_time: string
    packages: {
        name: string
    }
}

export default function Dashboard() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchBookings()
        }
    }, [user])

    const fetchBookings = async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                end_time,
                packages ( name )
            `)
            .eq('user_id', user?.id)
            .order('start_time', { ascending: false })

        if (error) {
            console.error("Error fetching bookings:", error)
        } else if (data) {
            // @ts-ignore - Supabase types via Join are a bit tricky without generating types
            setBookings(data as any)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Le tue Prenotazioni</h1>
                        <p className="text-slate-400">Gestisci i tuoi servizi fotografici previsti.</p>
                    </div>
                    <Link to="/booking">
                        <Button>Nuova Prenotazione</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <Card className="text-center py-12 border-dashed border-slate-700 bg-slate-900/50">
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                            <CalendarIcon className="h-12 w-12 text-slate-500" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-white">Nessuna prenotazione</h3>
                                <p className="text-sm text-slate-400">Non hai ancora prenotato alcun servizio fotografico.</p>
                            </div>
                            <Link to="/booking">
                                <Button variant="outline" className="mt-4 border-slate-700 hover:bg-slate-800 text-white">Inizia ora</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="relative overflow-hidden border-slate-800 bg-slate-900/80">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                        booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "",
                                        booking.status === 'pending' ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "",
                                        booking.status === 'cancelled' ? "bg-red-500/10 text-red-400 ring-red-500/20" : ""
                                    )}>
                                        {booking.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                                        {booking.status === 'pending' && <Clock className="h-3 w-3" />}
                                        {booking.status === 'cancelled' && <div className="h-2 w-2 rounded-full bg-red-400" />}
                                        {booking.status === 'pending' ? 'In attesa' : booking.status === 'confirmed' ? 'Confermato' : 'Annullato'}
                                    </span>
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-slate-100 pr-24">{booking.packages?.name || 'Pacchetto Eliminato'}</CardTitle>
                                    <CardDescription>ID Preferenza: #{booking.id.substring(0, 8)}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center text-sm text-slate-300">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-indigo-400" />
                                        <span className="capitalize">{format(new Date(booking.start_time), "EEEE d MMMM yyyy", { locale: it })}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-300">
                                        <Clock className="mr-2 h-4 w-4 text-indigo-400" />
                                        {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                                    </div>
                                    <Button variant="outline" className="w-full mt-4 border-slate-700 hover:bg-slate-800 text-slate-300" disabled>
                                        Gestisci (Prossimamente)
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
