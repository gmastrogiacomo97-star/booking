import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const [authError, setAuthError] = useState<string | null>(null)
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const onSubmit = async (data: any) => {
        setAuthError(null)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (error) {
            setAuthError(error.message)
        }
        // La redirezione avviene in automatico dal useEffect quando il context dell'user si aggiorna.
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-600 rounded-full mb-4 shadow-lg shadow-indigo-500/20">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Bentornato</h1>
                    <p className="text-slate-400">Accedi per gestire le tue prenotazioni</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Accedi</CardTitle>
                            <CardDescription>Inserisci le tue credenziali per accedere.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="mario@esempio.com"
                                    {...register("email", { required: "L'email è obbligatoria" })}
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password", { required: "La password è obbligatoria" })}
                                />
                                {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            {authError && <p className="text-sm text-red-500 text-center w-full">{authError}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Accesso in corso..." : "Accedi"}
                            </Button>
                            <div className="text-sm text-center text-slate-400">
                                Non hai un account?{" "}
                                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Registrati
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
