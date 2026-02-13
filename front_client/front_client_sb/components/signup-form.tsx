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
import { checkEmail, setPassword, register, saveToken, saveUser } from "@/lib/api/auth"

type SignupStep = 'email' | 'set-password' | 'full-registration'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>('email')
  const [email, setEmail] = useState('')
  const [existingClient, setExistingClient] = useState<{
    firstName: string
    lastName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data pour l'inscription complète
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Étape 1 : Vérifier l'email
  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await checkEmail(email)

      if (response.data.exists) {
        if (response.data.hasPassword) {
          // Le client existe déjà avec un mot de passe
          setError('Un compte existe déjà avec cet email. Veuillez vous connecter.')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          // Client existant sans mot de passe (migré)
          setExistingClient(response.data.client!)
          setStep('set-password')
        }
      } else {
        // Nouveau client - inscription complète
        setStep('full-registration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification de l\'email')
    } finally {
      setLoading(false)
    }
  }

  // Étape 2a : Définir le mot de passe pour un client existant
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const response = await setPassword(email, formData.password)

      // Sauvegarder le token et les données utilisateur
      saveToken(response.data.token)
      saveUser(response.data.user)

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la définition du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  // Étape 2b : Inscription complète
  const handleFullRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setError('Tous les champs sont requis')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const response = await register({
        email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })

      // Sauvegarder le token et les données utilisateur
      saveToken(response.data.token)
      saveUser(response.data.user)

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={
        step === 'email'
          ? handleEmailCheck
          : step === 'set-password'
          ? handleSetPassword
          : handleFullRegistration
      }
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <h1 className="text-4xl font-black font-archivo text-black uppercase">
            {step === 'set-password' ? 'Bienvenue !' : 'Inscription'}
          </h1>
          <p className="text-gray-700 text-base font-archivo">
            {step === 'email' && 'Entrez votre email pour commencer'}
            {step === 'set-password' && `Bonjour ${existingClient?.firstName}, définissez votre mot de passe`}
            {step === 'full-registration' && 'Créez votre compte Studio Barber'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 mb-4 font-archivo">
            {error}
          </div>
        )}

        {/* Étape 1 : Email */}
        {step === 'email' && (
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
        )}

        {/* Étape 2a : Définir le mot de passe (client existant) */}
        {step === 'set-password' && (
          <>
            <Field>
              <FieldLabel htmlFor="password" className="font-archivo font-bold text-black text-base uppercase">
                Mot de passe
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                Confirmer le mot de passe
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
          </>
        )}

        {/* Étape 2b : Inscription complète (nouveau client) */}
        {step === 'full-registration' && (
          <>
            <Field>
              <FieldLabel htmlFor="firstName" className="font-archivo font-bold text-black text-base uppercase">
                Prénom
              </FieldLabel>
              <Input
                id="firstName"
                type="text"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName" className="font-archivo font-bold text-black text-base uppercase">
                Nom
              </FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone" className="font-archivo font-bold text-black text-base uppercase">
                Téléphone
              </FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="06 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="font-archivo font-bold text-black text-base uppercase">
                Mot de passe
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                Confirmer le mot de passe
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
                className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
              />
            </Field>
          </>
        )}

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#DE2788] hover:bg-black text-white font-archivo font-black text-base uppercase py-6 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' :
             step === 'email' ? 'Continuer' :
             step === 'set-password' ? 'Activer mon compte' :
             'Créer mon compte'}
          </Button>
        </Field>

        {step !== 'email' && (
          <Button
            type="button"
            onClick={() => {
              setStep('email')
              setError('')
              setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                password: '',
                confirmPassword: ''
              })
            }}
            disabled={loading}
            className="w-full bg-gray-300 hover:bg-gray-400 text-black font-archivo font-bold text-base uppercase py-4 rounded-none transition-colors duration-300"
          >
            Retour
          </Button>
        )}
      </FieldGroup>

      <div className="text-center text-sm font-archivo">
        <span className="text-gray-700">Déjà un compte ? </span>
        <Link href="/login" className="text-[#DE2788] hover:underline font-semibold">
          Se connecter
        </Link>
      </div>
    </form>
  )
}
