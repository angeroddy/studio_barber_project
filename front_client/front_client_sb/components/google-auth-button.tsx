"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (init: {
            client_id: string
            callback: (response: {
              credential?: string
              select_by?: string
            }) => void
            ux_mode?: 'popup' | 'redirect'
            login_uri?: string
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              width?: string
              text?: 'signin_with' | 'signup_with' | 'continue_with'
            }
          ) => void
        }
      }
    }
  }
}

interface GoogleAuthButtonProps {
  onCredential: (idToken: string) => void | Promise<void>
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
  label?: string
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window indisponible'))
      return
    }

    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const scriptId = 'google-oauth-script'
    const existingScript = document.getElementById(scriptId)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Chargement Google SDK echoue')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Chargement Google SDK echoue'))
    }
    document.body.appendChild(script)
  })

  return googleScriptPromise
}

export function GoogleAuthButton({
  onCredential,
  onError,
  disabled,
  className = 'w-full',
  label = 'Continuer avec Google'
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [reloadKey, setReloadKey] = useState(0)

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()

  useEffect(() => {
    if (!containerRef.current || !clientId || disabled) {
      return
    }

    let cancelled = false

    setLoadState('loading')
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              void onCredential(response.credential)
            } else {
              onError?.('Impossible de recuperer le token Google')
            }
          },
          ux_mode: 'popup'
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with'
        })

        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        setLoadState('error')
        onError?.(error instanceof Error ? error.message : 'Connexion Google indisponible')
      })

    return () => {
      cancelled = true
    }
  }, [clientId, disabled, onCredential, onError, reloadKey])

  const retryLoad = () => {
    googleScriptPromise = null
    setLoadState('idle')
    setReloadKey((value) => value + 1)
    setTimeout(() => {
      setLoadState('loading')
    }, 0)
  }

  if (!clientId) {
    return (
      <button
        type="button"
        className={`${className} bg-gray-300 text-gray-700 px-4 py-4 rounded-none font-archivo font-bold`}
        disabled
      >
        Google non configure
      </button>
    )
  }

  return (
    <div className={`${className}`}>
      <p className="text-sm text-gray-500 font-archivo text-center mb-2">
        {loadState === 'loading'
          ? 'Chargement de Google...'
          : loadState === 'error'
          ? 'Erreur de chargement Google'
          : label}
      </p>
      <div
        ref={containerRef}
        key={reloadKey}
        className={disabled ? 'pointer-events-none opacity-60' : ''}
      />
      {loadState === 'error' && (
        <button
          type="button"
          onClick={retryLoad}
          disabled={disabled}
          className="mt-2 w-full border border-[#DE2788] text-[#DE2788] py-3 font-archivo font-bold uppercase text-sm hover:bg-[#DE2788] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Réessayer Google
        </button>
      )}
      {loadState !== 'ready' && loadState !== 'error' && (
        <button
          type="button"
          disabled
          className="w-full mt-2 bg-gray-200 text-gray-500 font-archivo font-bold py-3 rounded-none"
        >
          {loadState === 'loading' ? 'Chargement de Google...' : label}
        </button>
      )}
    </div>
  )
}
