import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Register() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const [authError, setAuthError] = useState<string | null>(null)
    const navigate = useNavigate()

    const onSubmit = async (data: any) => {
        setAuthError(null)
        const { error, data: authData } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.username,
                    full_name: data.username, // placeholder
                    phone: data.cellulare,
                    instagram: data.instagram,
                }
            }
        })

        if (error) {
            setAuthError(error.message)
        } else {
            // Create user profile in DB (normally done via DB trigger, but we can do it here depending on setup)
            if (authData.user) {
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        username: data.username,
                        full_name: data.username,
                        email: data.email,
                        phone: data.cellulare,
                        instagram: data.instagram
                    }
                ])
                if (profileError) {
                    console.error("Error creating profile:", profileError)
                    // We ignore this error for the UI for now, as Auth succeeded
                }
            }
            alert("Registrazione completata! Verifica la tua email.")
            navigate('/login')
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950 py-12">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-600 rounded-full mb-4 shadow-lg shadow-indigo-500/20">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Crea un Account</h1>
                    <p className="text-slate-400">Registrati per prenotare i tuoi servizi</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Registrazione</CardTitle>
                            <CardDescription>Compila i campi qui sotto per creare il tuo account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        placeholder="mario.rossi"
                                        {...register("username", { required: "Lo username è obbligatorio" })}
                                    />
                                    {errors.username && <p className="text-sm text-red-500">{errors.username.message as string}</p>}
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="mario@esempio.com"
                                        {...register("email", {
                                            required: "L'email è obbligatoria",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Indirizzo email non valido"
                                            }
                                        })}
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
                                </div>

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="cellulare">Cellulare</Label>
                                    <Input
                                        id="cellulare"
                                        type="tel"
                                        placeholder="+39 333 123 4567"
                                        {...register("cellulare", { required: "Il cellulare è obbligatorio" })}
                                    />
                                    {errors.cellulare && <p className="text-sm text-red-500">{errors.cellulare.message as string}</p>}
                                </div>

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="@mariorossi"
                                        {...register("instagram", { required: "L'account Instagram è obbligatorio" })}
                                    />
                                    {errors.instagram && <p className="text-sm text-red-500">{errors.instagram.message as string}</p>}
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        {...register("password", {
                                            required: "La password è obbligatoria",
                                            minLength: { value: 6, message: "Almeno 6 caratteri" }
                                        })}
                                    />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            {authError && <p className="text-sm text-red-500 text-center w-full">{authError}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Registrazione in corso..." : "Registrati"}
                            </Button>
                            <div className="text-sm text-center text-slate-400">
                                Hai già un account?{" "}
                                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Accedi
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
