import https from 'https'

interface SendClientVerificationEmailParams {
  to: string
  firstName: string
  token: string
  holdMinutes: number
  salonName: string
  serviceName: string
  bookingStartTime: Date
}

interface SendClientAccountVerificationEmailParams {
  to: string
  firstName: string
  token: string
  expiresAt: Date
}

interface SendBookingRecapEmailParams {
  to: string
  firstName: string
  salonName: string
  salonAddress?: string
  salonPhone?: string
  serviceLabel: string
  staffLabel?: string
  bookingStartTime: Date
}

interface SendStaffInvitationEmailParams {
  to: string
  firstName: string
  token: string
  expiresAt: Date
}

function getBackendPublicUrl(): string {
  const configured = process.env.BACKEND_PUBLIC_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  const port = process.env.PORT || '5000'
  return `http://localhost:${port}`
}

function getStaffAppUrl(): string {
  const configured = process.env.STAFF_APP_URL?.trim() || process.env.FRONTEND_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  return 'http://localhost:5173'
}

function postResendEmail(payload: Record<string, unknown>, apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        response.on('end', () => {
          const statusCode = response.statusCode || 500
          const body = Buffer.concat(chunks).toString('utf-8')
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`Resend error ${statusCode}: ${body}`))
            return
          }
          resolve()
        })
      }
    )

    request.on('error', reject)
    request.write(JSON.stringify(payload))
    request.end()
  })
}

function getResendConfig(): { apiKey: string; sender: string } {
  const apiKey = process.env.RESEND_API_KEY
  const sender = process.env.RESEND_FROM_EMAIL

  if (!apiKey) {
    throw new Error('RESEND_API_KEY manquant')
  }

  if (!sender) {
    throw new Error('RESEND_FROM_EMAIL manquant')
  }

  return { apiKey, sender }
}

export async function sendClientVerificationEmail(params: SendClientVerificationEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()

  const verificationUrl = `${getBackendPublicUrl()}/api/client-auth/verify-email?token=${encodeURIComponent(params.token)}`
  const formattedDate = new Date(params.bookingStartTime).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Confirmez votre compte et votre reservation',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h2>Bonjour ${params.firstName},</h2>
          <p>Confirmez votre email pour activer votre compte et valider votre reservation.</p>
          <p><strong>Salon:</strong> ${params.salonName}<br/>
          <strong>Prestation:</strong> ${params.serviceName}<br/>
          <strong>Date:</strong> ${formattedDate}</p>
          <p>Le creneau est bloque pendant ${params.holdMinutes} minutes.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:4px;">Confirmer mon email</a></p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien:</p>
          <p>${verificationUrl}</p>
        </div>
      `
    },
    apiKey
  )
}

export async function sendClientAccountVerificationEmail(
  params: SendClientAccountVerificationEmailParams
): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const verificationUrl = `${getBackendPublicUrl()}/api/client-auth/verify-email?token=${encodeURIComponent(params.token)}`
  const formattedExpiry = new Date(params.expiresAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Confirmez votre compte Studio Barber',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h2>Bonjour ${params.firstName},</h2>
          <p>Confirmez votre adresse email pour activer votre compte client.</p>
          <p>Ce lien est valable jusqu'au ${formattedExpiry}.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:4px;">Confirmer mon email</a></p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien:</p>
          <p>${verificationUrl}</p>
        </div>
      `
    },
    apiKey
  )
}

export async function sendBookingRecapEmail(params: SendBookingRecapEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const formattedDate = new Date(params.bookingStartTime).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const salonAddressLine = params.salonAddress ? `<p><strong>Adresse:</strong> ${params.salonAddress}</p>` : ''
  const salonPhoneLine = params.salonPhone ? `<p><strong>Telephone:</strong> ${params.salonPhone}</p>` : ''
  const staffLine = params.staffLabel ? `<p><strong>Professionnel:</strong> ${params.staffLabel}</p>` : ''

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Recapitulatif de votre rendez-vous',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h2>Bonjour ${params.firstName},</h2>
          <p>Votre rendez-vous est bien enregistre.</p>
          <p><strong>Salon:</strong> ${params.salonName}</p>
          ${salonAddressLine}
          ${salonPhoneLine}
          <p><strong>Prestation:</strong> ${params.serviceLabel}</p>
          ${staffLine}
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p>Merci pour votre confiance.</p>
        </div>
      `
    },
    apiKey
  )
}

export async function sendStaffInvitationEmail(params: SendStaffInvitationEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const invitationUrl = `${getStaffAppUrl()}/signin?staffInviteToken=${encodeURIComponent(params.token)}`
  const formattedExpiry = new Date(params.expiresAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Activez votre compte employe',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h2>Bonjour ${params.firstName},</h2>
          <p>Vous avez ete ajoute(e) a l'equipe. Cliquez sur le lien ci-dessous pour choisir votre mot de passe et activer votre compte.</p>
          <p>Ce lien est valable jusqu'au ${formattedExpiry}.</p>
          <p><a href="${invitationUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:4px;">Activer mon compte</a></p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien:</p>
          <p>${invitationUrl}</p>
        </div>
      `
    },
    apiKey
  )
}
