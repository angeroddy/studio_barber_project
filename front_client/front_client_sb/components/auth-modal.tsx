'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { checkEmail, setPassword, register, login, saveToken, saveUser } from "@/lib/api/auth"

type AuthStep = 'email' | 'set-password' | 'full-registration' | 'login'
type AuthMode = 'signup' | 'login'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
const PASSWORD_HINT = 'Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Mot de passe minimum 8 caractères'
  if (!PASSWORD_REGEX.test(password)) return PASSWORD_HINT
  return null
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bookingDetails?: {
    serviceName: string
    professionalName: string
    date: string
    time: string
  }
}

export function AuthModal({ isOpen, onClose, onSuccess, bookingDetails }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [existingClient, setExistingClient] = useState<{
    firstName: string
    lastName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  if (!isOpen) return null

  // Reset modal state
  const resetModal = () => {
    setMode('signup')
    setStep('email')
    setEmail('')
    setExistingClient(null)
    setError('')
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  // ============= SIGNUP HANDLERS =============

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await checkEmail(email)

      if (response.data.exists) {
        if (response.data.hasPassword) {
          setError('Un compte existe déjà avec cet email.')
          setMode('login')
          setStep('login')
        } else {
          setExistingClient(response.data.client!)
          setStep('set-password')
        }
      } else {
        setStep('full-registration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification de l\'email')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const pwdError = validatePassword(formData.password)
    if (pwdError) {
      setError(pwdError)
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
      saveToken(response.data.token)
      saveUser(response.data.user)
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la définition du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const handleFullRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setError('Tous les champs sont requis')
      setLoading(false)
      return
    }

    const pwdError = validatePassword(formData.password)
    if (pwdError) {
      setError(pwdError)
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

      saveToken(response.data.token)
      saveUser(response.data.user)
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  // ============= LOGIN HANDLER =============

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !formData.password) {
      setError('Veuillez remplir tous les champs')
      setLoading(false)
      return
    }

    try {
      const response = await login(email, formData.password)
      saveToken(response.data.token)
      saveUser(response.data.user)
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-black">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-300 p-6 flex justify-between items-center">
          <h2 className="font-archivo font-black text-2xl text-black uppercase">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:text-[#DE2788] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Booking details banner */}
        {bookingDetails && (
          <div className="bg-[#DE2788] text-white p-6">
            <p className="font-archivo font-bold text-lg mb-2">
              Pour confirmer votre réservation :
            </p>
            <p className="font-archivo text-sm">
              {bookingDetails.serviceName} avec {bookingDetails.professionalName}
              <br />
              le {bookingDetails.date} à {bookingDetails.time}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Mode switcher */}
          <div className="flex gap-2 mb-6 border-b-2 border-gray-300">
            <button
              onClick={() => {
                setMode('signup')
                setStep('email')
                setError('')
              }}
              className={`flex-1 py-3 font-archivo font-bold text-base uppercase transition-colors ${
                mode === 'signup'
                  ? 'text-[#DE2788] border-b-4 border-[#DE2788]'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              S'inscrire
            </button>
            <button
              onClick={() => {
                setMode('login')
                setStep('login')
                setError('')
              }}
              className={`flex-1 py-3 font-archivo font-bold text-base uppercase transition-colors ${
                mode === 'login'
                  ? 'text-[#DE2788] border-b-4 border-[#DE2788]'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Se connecter
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 mb-6 font-archivo">
              {error}
            </div>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form
              onSubmit={
                step === 'email'
                  ? handleEmailCheck
                  : step === 'set-password'
                  ? handleSetPassword
                  : handleFullRegistration
              }
            >
              <FieldGroup>
                <div className="mb-6">
                  <p className="text-gray-700 text-base font-archivo">
                    {step === 'email' && 'Entrez votre email pour commencer'}
                    {step === 'set-password' && `Bonjour ${existingClient?.firstName}, définissez votre mot de passe`}
                    {step === 'full-registration' && 'Complétez votre inscription'}
                  </p>
                </div>

                {/* Email step */}
                {step === 'email' && (
                  <Field>
                    <FieldLabel htmlFor="signup-email" className="font-archivo font-bold text-black text-base uppercase">
                      Email
                    </FieldLabel>
                    <Input
                      id="signup-email"
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

                {/* Set password step */}
                {step === 'set-password' && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="signup-password" className="font-archivo font-bold text-black text-base uppercase">
                        Mot de passe
                      </FieldLabel>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Au moins 8 caractères"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="signup-confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input
                        id="signup-confirm-password"
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

                {/* Full registration step */}
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
                      <FieldLabel htmlFor="reg-password" className="font-archivo font-bold text-black text-base uppercase">
                        Mot de passe
                      </FieldLabel>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Au moins 8 caractères"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="reg-confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input
                        id="reg-confirm-password"
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
                    className="w-full bg-gray-300 hover:bg-gray-400 text-black font-archivo font-bold text-base uppercase py-4 rounded-none transition-colors duration-300 mt-4"
                  >
                    Retour
                  </Button>
                )}
              </FieldGroup>
            </form>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-email" className="font-archivo font-bold text-black text-base uppercase">
                    Email
                  </FieldLabel>
                  <Input
                    id="login-email"
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
                  <FieldLabel htmlFor="login-password" className="font-archivo font-bold text-black text-base uppercase">
                    Mot de passe
                  </FieldLabel>
                  <Input
                    id="login-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
