import React, { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Calendar } from '../components/ui/calendar'
import { Camera, Clock, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react'
import { format, addMinutes, setHours, setMinutes, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

// Costanti orarie (inizio e fine giornata lavorativa)
const WORK_HOURS = {
    start: 9, // 09:00
    end: 18,  // 18:00
}

interface Package {
    id: string
    name: string
    description: string
    price: number
    duration_minutes: number
}

// Interfaccia fittizia per raggruppare visivamente i pacchetti nel front-end
interface DisplayPackage {
    id: string
    name: string
    desc: string
    duration?: number
    price?: number
    subOptions?: Package[]
}

export default function Booking() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [packages, setPackages] = useState<DisplayPackage[]>([])
    const [step, setStep] = useState(1)

    // Per gestire sia l'opzione principale sia l'eventuale subOption (selezionata dal select)
    const [selectedPackageGroupId, setSelectedPackageGroupId] = useState<string | null>(null)
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    const [availableSlots, setAvailableSlots] = useState<{ time: string, available: boolean }[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchPackages()
    }, [])

    useEffect(() => {
        if (date && selectedPackage) {
            fetchSlots(date, selectedPackage)
        } else {
            setAvailableSlots([])
        }
    }, [date, selectedPackage])

    const fetchPackages = async () => {
        const { data, error } = await supabase.from('packages').select('*').order('price', { ascending: true })

        if (data && !error) {
            // Raggruppiamo i pacchetti "Base" se necessario per la UI, come richiesto
            const promo = data.find(p => p.name.includes("Promo"))
            const baseSingolo = data.find(p => p.name.includes("Base") && p.name.includes("Singolo"))
            const baseCoppia = data.find(p => p.name.includes("Base") && p.name.includes("Coppia"))
            const premium = data.find(p => p.name.includes("Premium"))
            const gold = data.find(p => p.name.includes("Gold"))
            const star = data.find(p => p.name.includes("Star"))

            const displayPackages: DisplayPackage[] = []

            if (promo) displayPackages.push({ id: promo.id, name: promo.name, desc: promo.description, price: promo.price, duration: promo.duration_minutes })

            if (baseSingolo || baseCoppia) {
                const subOptions = []
                if (baseSingolo) subOptions.push(baseSingolo)
                if (baseCoppia) subOptions.push(baseCoppia)

                displayPackages.push({
                    id: 'base-group',
                    name: 'Base',
                    desc: '3 foto con editing.',
                    subOptions: subOptions
                })
            }

            if (premium) displayPackages.push({ id: premium.id, name: premium.name, desc: premium.description, price: premium.price, duration: premium.duration_minutes })
            if (gold) displayPackages.push({ id: gold.id, name: gold.name, desc: gold.description, price: gold.price, duration: gold.duration_minutes })
            if (star) displayPackages.push({ id: star.id, name: star.name, desc: star.description, price: star.price, duration: star.duration_minutes })

            // Fallback per mostrare i pacchetti crudi se la logica di estrazione stringhe fallisce per via dei nomi
            if (displayPackages.length === 0) {
                setPackages(data.map(p => ({ id: p.id, name: p.name, desc: p.description, price: p.price, duration: p.duration_minutes })))
            } else {
                setPackages(displayPackages)
            }
        }
    }

    const fetchSlots = async (selectedDate: Date, pkg: Package) => {
        // Calcola inizio e fine della giornata
        const dayStart = setMinutes(setHours(selectedDate, WORK_HOURS.start), 0)
        const dayEnd = setMinutes(setHours(selectedDate, WORK_HOURS.end), 0)

        // Seleziona dal DB le prenotazioni già esistenti per questa data
        const { data: existingBookings } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .gte('start_time', dayStart.toISOString())
            .lte('end_time', dayEnd.toISOString())
            .neq('status', 'cancelled')

        const slots = []
        let currentSlot = dayStart

        // Genera slot di 30 minuti
        while (currentSlot < dayEnd) {
            const slotEndTime = addMinutes(currentSlot, pkg.duration_minutes)

            if (slotEndTime > dayEnd) {
                break // Non sfora l'orario di lavoro
            }

            // Ignoriamo orari passati se la data è oggi
            const now = new Date()
            let isPast = false;
            if (isSameDay(selectedDate, now) && currentSlot < now) {
                isPast = true;
            }

            // Verifica collisioni con altre prenotazioni
            const isConflicting = existingBookings?.some(booking => {
                const bStart = new Date(booking.start_time)
                const bEnd = new Date(booking.end_time)
                return (currentSlot < bEnd && slotEndTime > bStart)
            })

            slots.push({
                time: format(currentSlot, 'HH:mm'),
                available: !isConflicting && !isPast
            })

            // Intervallo tra gli slot (30 min)
            currentSlot = addMinutes(currentSlot, 30)
        }

        setAvailableSlots(slots)
    }


    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const handleConfirm = async () => {
        if (!user || !selectedPackage || !date || !selectedTime) return

        setIsSubmitting(true)
        try {
            const [hours, minutes] = selectedTime.split(':').map(Number)
            const startTime = setMinutes(setHours(date, hours), minutes)
            const endTime = addMinutes(startTime, selectedPackage.duration_minutes)

            const { error } = await supabase.from('bookings').insert([{
                user_id: user.id,
                package_id: selectedPackage.id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'pending' // pending fino a conferma pagamento/admin
            }])

            if (error) throw error

            alert("Prenotazione confermata con successo!")
            navigate('/dashboard')
        } catch (error: any) {
            alert("Errore durante la prenotazione: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Gestore click per pacchetto
    const onPackageClick = (pkg: DisplayPackage) => {
        setSelectedPackageGroupId(pkg.id)
        if (!pkg.subOptions) {
            // Se non ha subOptions, lo selezioniamo come vero Package
            setSelectedPackage({
                id: pkg.id,
                name: pkg.name,
                description: pkg.desc,
                price: pkg.price!,
                duration_minutes: pkg.duration!
            })
        } else {
            // Se ha subOptions, resettiamo la subOption finchè non usa il select
            setSelectedPackage(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Nuova Prenotazione</h1>
                    <div className="flex items-center text-sm font-medium text-slate-400 space-x-2">
                        <span className={cn(step >= 1 ? "text-indigo-400" : "")}>1. Pacchetto</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className={cn(step >= 2 ? "text-indigo-400" : "")}>2. Data e Ora</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className={cn(step === 3 ? "text-indigo-400" : "")}>3. Riepilogo</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {packages.map(pkg => {
                            const isSelected = selectedPackageGroupId === pkg.id;

                            return (
                                <Card
                                    key={pkg.id}
                                    className={cn(
                                        "transition-all border-slate-800",
                                        isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/5" : "hover:border-slate-600"
                                    )}
                                >
                                    <div
                                        className={cn("cursor-pointer h-full flex flex-col")}
                                        onClick={() => onPackageClick(pkg)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg flex justify-between">
                                                {pkg.name}
                                                {isSelected && !pkg.subOptions && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                                            </CardTitle>
                                            {!pkg.subOptions && (
                                                <CardDescription className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" /> {pkg.duration} min
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="flex flex-col flex-grow justify-between">
                                            <div>
                                                <p className="text-slate-300 text-sm mb-4">{pkg.desc}</p>
                                                {!pkg.subOptions && <p className="text-xl font-bold text-white">€{pkg.price}</p>}
                                            </div>

                                            {pkg.subOptions && isSelected && (
                                                <div className="mt-4 pt-4 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                                                    <label htmlFor={`select-${pkg.id}`} className="block text-sm font-medium text-slate-400 mb-2">
                                                        Seleziona la tipologia:
                                                    </label>
                                                    <select
                                                        id={`select-${pkg.id}`}
                                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                                                        value={selectedPackage?.id || ""}
                                                        onChange={(e) => {
                                                            const sub = pkg.subOptions?.find(s => s.id === e.target.value);
                                                            if (sub) {
                                                                setSelectedPackage(sub);
                                                            }
                                                        }}
                                                    >
                                                        <option value="" disabled>Scegli un'opzione</option>
                                                        {pkg.subOptions.map(sub => (
                                                            <option key={sub.id} value={sub.id}>
                                                                {sub.name} - {sub.duration_minutes} min - €{sub.price}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Seleziona una data</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d: Date | undefined) => { setDate(d); setSelectedTime(null); }}
                                    className="rounded-md border border-slate-800"
                                    disabled={(d: Date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return d < today || d.getDay() === 0 || d.getDay() === 6;
                                    }}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Orari disponibili</CardTitle>
                                <CardDescription>
                                    {date ? format(date, "EEEE d MMMM yyyy", { locale: it }) : "Seleziona prima una data"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!date ? (
                                    <p className="text-slate-400 text-center py-8">Scegli una data nel calendario.</p>
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-orange-400 text-center py-8">Nessun orario disponibile in questa data.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableSlots.map((slot, i) => (
                                            <Button
                                                key={i}
                                                variant={selectedTime === slot.time ? "default" : "outline"}
                                                className={cn(
                                                    "w-full",
                                                    !slot.available && "opacity-50 cursor-not-allowed border-red-500/20 text-slate-500 bg-red-500/5 hover:bg-red-500/5 hover:text-slate-500"
                                                )}
                                                disabled={!slot.available}
                                                onClick={() => setSelectedTime(slot.time)}
                                            >
                                                {slot.time}
                                                {!slot.available && " (Occupato)"}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 3 && selectedPackage && (
                    <Card className="max-w-xl mx-auto">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Riepilogo Prenotazione</CardTitle>
                            <CardDescription>Controlla i dati prima di confermare</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Pacchetto</span>
                                <span className="font-medium text-white">{selectedPackage.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Data</span>
                                <span className="font-medium text-white capitalize">{date && format(date, "EEEE d MMMM yyyy", { locale: it })}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Orario</span>
                                <span className="font-medium text-white">{selectedTime}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Durata Stimata</span>
                                <span className="font-medium text-white">{selectedPackage.duration_minutes} min</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-400">Totale stimato</span>
                                <span className="text-2xl font-bold text-white">€{selectedPackage.price}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-between mt-10">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
                        </Button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(step === 1 && (!selectedPackage || !selectedPackageGroupId)) || (step === 2 && !selectedTime)}
                        >
                            Avanti <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
                            {isSubmitting ? "Conferma in corso..." : "Conferma Prenotazione"}
                        </Button>
                    )}
                </div>
            </main>
        </div>
    )
}
