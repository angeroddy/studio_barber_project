'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { checkEmail, setPassword, register, registerWithBooking, login, saveToken, saveUser, loginWithGoogle, SocialAuthError } from "@/lib/api/auth"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { PasswordGuidance } from "@/components/password-guidance"
import { validatePassword } from "@/lib/password-policy"

type AuthStep = 'email' | 'set-password' | 'full-registration' | 'login' | 'google-phone'
type AuthMode = 'signup' | 'login'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onVerificationPending?: (email: string) => void
  bookingDetails?: {
    serviceName: string
    professionalName: string
    date: string
    time: string
    pendingBooking?: {
      salonId: string
      serviceId: string
      staffId?: string
      startTime: string
      notes?: string
    }
  }
}

export function AuthModal({ isOpen, onClose, onSuccess, onVerificationPending, bookingDetails }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [existingClient, setExistingClient] = useState<{
    firstName: string
    lastName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [googleAuthToken, setGoogleAuthToken] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const isBookingSignupFlow = Boolean(bookingDetails?.pendingBooking)

  if (!isOpen) return null

  // Reset modal state
  const resetModal = () => {
    setMode('signup')
    setStep('email')
    setEmail('')
    setExistingClient(null)
    setError('')
    setSuccessMessage('')
    setGoogleAuthToken('')
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
  const getPendingBookingPayload = (): {
    salonId: string
    serviceId: string
    staffId?: string
    startTime: string
    notes?: string
  } | undefined => {
    return bookingDetails?.pendingBooking
  }

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

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
    setSuccessMessage('')

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
      if (isBookingSignupFlow && bookingDetails?.pendingBooking) {
        if (!formData.phone) {
          setError('Le telephone est requis')
          setLoading(false)
          return
        }

        await registerWithBooking({
          email,
          password: formData.password,
          firstName: existingClient?.firstName || '',
          lastName: existingClient?.lastName || '',
          phone: formData.phone,
          ...bookingDetails.pendingBooking
        })

        onVerificationPending?.(email)
        handleClose()
        return
      }

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
    setSuccessMessage('')

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
      if (isBookingSignupFlow && bookingDetails?.pendingBooking) {
        await registerWithBooking({
          email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          ...bookingDetails.pendingBooking
        })

        onVerificationPending?.(email)
        handleClose()
        return
      }

      const response = await register({
        email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })

      setSuccessMessage(response.message || 'Un email de confirmation vous a ete envoye')
      onVerificationPending?.(email)
      setMode('login')
      setStep('login')
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async (idToken: string) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await loginWithGoogle({
        idToken,
        pendingBooking: getPendingBookingPayload()
      })

      if (response.data.mode === 'authenticated') {
        saveToken(response.data.token)
        saveUser(response.data.user)
        onSuccess()
        handleClose()
        return
      }

      if (response.data.mode === 'verification_pending') {
        onVerificationPending?.(response.data.email)
        handleClose()
        return
      }

      setError('Reponse Google inattendue')
    } catch (err) {
      const socialError = err as SocialAuthError
      if (socialError?.errorCode === 'PHONE_REQUIRED') {
        setGoogleAuthToken(idToken)
        setMode('signup')
        setStep('google-phone')
        setError('Ajoutez un numéro de téléphone pour continuer')
        return
      }

      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion Google')
    } finally {
      setLoading(false)
    }
  }

  const handleGooglePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    if (!formData.phone) {
      setError('Le téléphone est requis')
      setLoading(false)
      return
    }

    try {
      const response = await loginWithGoogle({
        idToken: googleAuthToken,
        phone: formData.phone,
        pendingBooking: getPendingBookingPayload()
      })

      if (response.data.mode === 'authenticated') {
        saveToken(response.data.token)
        saveUser(response.data.user)
        onSuccess()
        handleClose()
        return
      }

      if (response.data.mode === 'verification_pending') {
        onVerificationPending?.(response.data.email)
        setGoogleAuthToken('')
        handleClose()
        return
      }

      setError('Reponse Google inattendue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation Google')
    } finally {
      setLoading(false)
    }
  }

  // ============= LOGIN HANDLER =============

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

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
            type="button"
            onClick={handleClose}
            aria-label="Fermer la fenêtre d'authentification"
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
              type="button"
              onClick={() => {
                setMode('signup')
                setStep('email')
                setError('')
                setSuccessMessage('')
                setGoogleAuthToken('')
              }}
              className={`flex-1 py-3 font-archivo font-bold text-base uppercase transition-colors ${
                mode === 'signup'
                  ? 'text-[#DE2788] border-b-4 border-[#DE2788]'
                  : 'text-gray-500 hover:text-black'
              }`}
              aria-pressed={mode === 'signup'}
            >
              S'inscrire
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setStep('login')
                setError('')
                setSuccessMessage('')
                setGoogleAuthToken('')
              }}
              className={`flex-1 py-3 font-archivo font-bold text-base uppercase transition-colors ${
                mode === 'login'
                  ? 'text-[#DE2788] border-b-4 border-[#DE2788]'
                  : 'text-gray-500 hover:text-black'
              }`}
              aria-pressed={mode === 'login'}
            >
              Se connecter
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border-2 border-red-500 text-red-700 p-4 mb-6 font-archivo"
            >
              {error}
            </div>
          )}
          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="bg-green-50 border-2 border-green-600 text-green-800 p-4 mb-6 font-archivo"
            >
              {successMessage}
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
                  : step === 'google-phone'
                  ? handleGooglePhone
                  : handleFullRegistration
              }
            >
              <FieldGroup>
                <div className="mb-6">
                  <p className="text-gray-700 text-base font-archivo">
                    {step === 'email' && 'Entrez votre email pour commencer'}
                    {step === 'set-password' && `Bonjour ${existingClient?.firstName}, définissez votre mot de passe`}
                    {step === 'full-registration' && 'Complétez votre inscription'}
                    {step === 'google-phone' && 'Renseignez votre numéro pour continuer avec Google'}
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
                      autoComplete="email"
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
                    {isBookingSignupFlow && (
                      <Field>
                        <FieldLabel htmlFor="signup-phone" className="font-archivo font-bold text-black text-base uppercase">
                          Téléphone
                        </FieldLabel>
                        <Input
                          id="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="06 XX XX XX XX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          disabled={loading}
                          className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                        />
                      </Field>
                    )}
                    <Field>
                      <FieldLabel htmlFor="signup-password" className="font-archivo font-bold text-black text-base uppercase">
                        Mot de passe
                      </FieldLabel>
                        <Input
                          id="signup-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Au moins 8 caractères"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                    </Field>
                    <PasswordGuidance password={formData.password} />
                    <Field>
                      <FieldLabel htmlFor="signup-confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 font-archivo">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
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
                        autoComplete="given-name"
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
                        autoComplete="family-name"
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
                        autoComplete="tel"
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
                        autoComplete="new-password"
                        placeholder="Au moins 8 caractères"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                    </Field>
                    <PasswordGuidance password={formData.password} />
                    <Field>
                      <FieldLabel htmlFor="reg-confirm-password" className="font-archivo font-bold text-black text-base uppercase">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input
                        id="reg-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={loading}
                        className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 font-archivo">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                    </Field>
                  </>
                )}

                {/* Google phone step */}
                {step === 'google-phone' && (
                  <Field>
                    <FieldLabel htmlFor="google-phone" className="font-archivo font-bold text-black text-base uppercase">
                      Téléphone
                    </FieldLabel>
                    <Input
                      id="google-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="06 XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      disabled={loading}
                      className="border-2 border-gray-300 rounded-none p-4 font-archivo focus:border-[#DE2788] focus:ring-0"
                    />
                  </Field>
                )}

                <Field>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#DE2788] hover:bg-black text-white font-archivo font-black text-base uppercase py-6 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {loading ? 'Chargement...' :
                   step === 'email' ? 'Continuer' :
                   step === 'google-phone' ? 'Valider' :
                   step === 'set-password' ? 'Activer mon compte' :
                   'Créer mon compte'}
                </Button>
              </Field>

                {step !== 'email' && step !== 'google-phone' && (
                  <Button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setError('')
                      setSuccessMessage('')
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

                {step === 'google-phone' && (
                  <Button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setGoogleAuthToken('')
                      setError('')
                      setSuccessMessage('')
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

                {step === 'email' && (
                  <>
                    <div className="text-center mt-6 mb-4">
                      <span className="text-sm text-gray-500 font-archivo">ou</span>
                    </div>
                    <GoogleAuthButton
                      onCredential={handleGoogleAuth}
                      onError={(message) => setError(message)}
                      disabled={loading}
                    />
                  </>
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
                    autoComplete="email"
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
                    autoComplete="current-password"
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

                <div className="text-center mt-6 mb-4">
                  <span className="text-sm text-gray-500 font-archivo">ou</span>
                </div>
                <GoogleAuthButton
                  onCredential={handleGoogleAuth}
                  onError={(message) => setError(message)}
                  disabled={loading}
                />
              </FieldGroup>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
