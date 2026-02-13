'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { login, saveToken, saveUser } from "@/lib/api/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation basique
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      setLoading(false)
      return
    }

    try {
      const response = await login(email, password)

      // Sauvegarder le token et les données utilisateur
      saveToken(response.data.token)
      saveUser(response.data.user)

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <h1 className="text-4xl font-black font-archivo text-black uppercase">Connexion</h1>
          <p className="text-gray-700 text-base font-archivo">
            Accédez à votre espace client Studio Barber
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 mb-4 font-archivo">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email" className="font-archivo font-bold text-black text-base uppercase">
            Email
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password" className="font-archivo font-bold text-black text-base uppercase">
              Mot de passe
            </FieldLabel>
            <a
              href="#"
              className="text-sm font-archivo text-[#DE2788] hover:underline font-semibold"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Implémenter la récupération de mot de passe
                alert('Fonctionnalité à venir')
              }}
            >
              Mot de passe oublié ?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#DE2788] hover:bg-black text-white font-archivo font-black text-base uppercase py-6 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </Field>
      </FieldGroup>

      <div className="text-center text-sm font-archivo">
        <span className="text-gray-700">Pas de compte ? </span>
        <Link href="/register" className="text-[#DE2788] hover:underline font-semibold">
          S&apos;inscrire
        </Link>
      </div>
    </form>
  )
}
