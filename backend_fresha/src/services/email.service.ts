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

interface SendBookingReminder24hEmailParams {
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

interface BrandedEmailRow {
  label: string
  value: string
}

interface BrandedEmailCta {
  label: string
  url: string
}

interface BrandedEmailParams {
  preheader: string
  badge: string
  title: string
  firstName: string
  introLines: string[]
  rows: BrandedEmailRow[]
  cta?: BrandedEmailCta
  footerLine?: string
}

function getBackendPublicUrl(): string {
  const configured =
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    (process.env.RENDER_EXTERNAL_HOSTNAME?.trim()
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME.trim()}`
      : '')

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'BACKEND_PUBLIC_URL manquant en production (ou RENDER_EXTERNAL_URL/RENDER_EXTERNAL_HOSTNAME indisponible)'
    )
  }

  const port = process.env.PORT || '5000'
  return `http://localhost:${port}`
}

function getStaffAppUrl(): string {
  const configured =
    process.env.STAFF_APP_URL?.trim() ||
    process.env.ADMIN_APP_URL?.trim() ||
    process.env.FRONTEND_URL?.trim()

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('STAFF_APP_URL manquant en production')
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function renderBrandedEmail(params: BrandedEmailParams): string {
  const introHtml = params.introLines
    .map(
      (line) =>
        `<p style="margin:0 0 12px 0;font-family:Arial,'Helvetica Neue',sans-serif;color:#1f2937;font-size:15px;line-height:1.55;">${escapeHtml(line)}</p>`
    )
    .join('')

  const rowsHtml = params.rows
    .map((row) => {
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ececec;">
            <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">${escapeHtml(row.label)}</p>
            <p style="margin:4px 0 0 0;font-family:Arial,'Helvetica Neue',sans-serif;font-size:16px;line-height:1.4;color:#111111;font-weight:700;">${escapeHtml(row.value)}</p>
          </td>
        </tr>
      `
    })
    .join('')

  const ctaHtml = params.cta
    ? `
        <tr>
          <td style="padding:20px 0 0 0;">
            <a href="${escapeHtml(params.cta.url)}" style="display:inline-block;background:#de2788;color:#ffffff;text-decoration:none;font-family:Arial,'Helvetica Neue',sans-serif;font-size:13px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:14px 20px;border:1px solid #de2788;">
              ${escapeHtml(params.cta.label)}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 0 0;">
            <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;color:#4b5563;font-size:13px;line-height:1.5;">
              Si le bouton ne fonctionne pas, copiez ce lien:<br />
              <a href="${escapeHtml(params.cta.url)}" style="color:#de2788;word-break:break-all;">${escapeHtml(params.cta.url)}</a>
            </p>
          </td>
        </tr>
      `
    : ''

  const footerLine = params.footerLine || 'A tres vite chez Studio Barber.'

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#f5f5f5;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
          ${escapeHtml(params.preheader)}
        </div>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #111111;">
                <tr>
                  <td style="padding:24px 26px;background:#111111;border-top:4px solid #de2788;">
                    <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;font-size:22px;line-height:1;color:#ffffff;font-weight:900;letter-spacing:0.04em;">STUDIO BARBER</p>
                    <p style="margin:10px 0 0 0;font-family:Arial,'Helvetica Neue',sans-serif;color:#de2788;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:800;">${escapeHtml(params.badge)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 26px 24px 26px;">
                    <h1 style="margin:0 0 16px 0;font-family:Arial,'Helvetica Neue',sans-serif;color:#111111;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:0.02em;text-transform:uppercase;">
                      ${escapeHtml(params.title)}
                    </h1>

                    <p style="margin:0 0 14px 0;font-family:Arial,'Helvetica Neue',sans-serif;color:#111111;font-size:16px;line-height:1.5;">
                      Bonjour ${escapeHtml(params.firstName)},
                    </p>

                    ${introHtml}

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;border:1px solid #111111;padding:14px 16px 0 16px;">
                      ${rowsHtml}
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${ctaHtml}
                    </table>

                    <p style="margin:20px 0 0 0;font-family:Arial,'Helvetica Neue',sans-serif;color:#111111;font-size:15px;line-height:1.55;">
                      ${escapeHtml(footerLine)}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 26px;background:#fafafa;border-top:1px solid #ececec;">
                    <p style="margin:0;font-family:Arial,'Helvetica Neue',sans-serif;color:#6b7280;font-size:12px;line-height:1.45;">
                      PLUS QU'UNE COUPE, UN RITUEL.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function buildBookingRows(params: {
  salonName: string
  salonAddress?: string
  salonPhone?: string
  serviceLabel: string
  staffLabel?: string
  bookingStartTime: Date
}): BrandedEmailRow[] {
  const rows: BrandedEmailRow[] = [
    { label: 'Salon', value: params.salonName },
    { label: 'Prestation', value: params.serviceLabel },
    { label: 'Date et heure', value: formatDateTime(params.bookingStartTime) }
  ]

  if (params.staffLabel) {
    rows.splice(2, 0, { label: 'Professionnel', value: params.staffLabel })
  }

  if (params.salonAddress) {
    rows.push({ label: 'Adresse', value: params.salonAddress })
  }

  if (params.salonPhone) {
    rows.push({ label: 'Telephone', value: params.salonPhone })
  }

  return rows
}

export async function sendClientVerificationEmail(params: SendClientVerificationEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const verificationUrl = `${getBackendPublicUrl()}/api/client-auth/verify-email?token=${encodeURIComponent(params.token)}`

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Confirmez votre compte et votre reservation',
      html: renderBrandedEmail({
        preheader: 'Confirmez votre email pour valider votre reservation.',
        badge: 'Email a confirmer',
        title: 'Confirmez votre compte',
        firstName: params.firstName,
        introLines: [
          'Confirmez votre email pour activer votre compte client et valider votre reservation.',
          `Ce creneau reste bloque pendant ${params.holdMinutes} minutes.`
        ],
        rows: [
          { label: 'Salon', value: params.salonName },
          { label: 'Prestation', value: params.serviceName },
          { label: 'Date et heure', value: formatDateTime(params.bookingStartTime) }
        ],
        cta: {
          label: 'Confirmer mon email',
          url: verificationUrl
        }
      })
    },
    apiKey
  )
}

export async function sendClientAccountVerificationEmail(
  params: SendClientAccountVerificationEmailParams
): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const verificationUrl = `${getBackendPublicUrl()}/api/client-auth/verify-email?token=${encodeURIComponent(params.token)}`

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Confirmez votre compte Studio Barber',
      html: renderBrandedEmail({
        preheader: 'Activez votre compte client Studio Barber.',
        badge: 'Creation de compte',
        title: 'Activation du compte client',
        firstName: params.firstName,
        introLines: ['Confirmez votre adresse email pour activer votre espace client.'],
        rows: [{ label: 'Lien valide jusqu au', value: formatDateTime(params.expiresAt) }],
        cta: {
          label: 'Activer mon compte',
          url: verificationUrl
        }
      })
    },
    apiKey
  )
}

export async function sendBookingRecapEmail(params: SendBookingRecapEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Recapitulatif de votre rendez-vous',
      html: renderBrandedEmail({
        preheader: 'Votre rendez-vous Studio Barber est confirme.',
        badge: 'Rendez-vous confirme',
        title: 'Reservation enregistree',
        firstName: params.firstName,
        introLines: [
          'Votre rendez-vous est bien enregistre.',
          'Retrouvez toutes les informations ci-dessous.'
        ],
        rows: buildBookingRows(params)
      })
    },
    apiKey
  )
}

export async function sendBookingReminder24hEmail(params: SendBookingReminder24hEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Rappel: votre rendez-vous est dans 24h',
      html: renderBrandedEmail({
        preheader: 'Rappel: votre rendez-vous Studio Barber a lieu dans 24h.',
        badge: 'Rappel 24h',
        title: 'Votre rendez-vous approche',
        firstName: params.firstName,
        introLines: [
          'Petit rappel: votre rendez-vous est prevu dans les prochaines 24 heures.',
          'On vous attend chez Studio Barber.'
        ],
        rows: buildBookingRows(params),
        footerLine: 'En cas de besoin, contactez directement votre salon.'
      })
    },
    apiKey
  )
}

export async function sendStaffInvitationEmail(params: SendStaffInvitationEmailParams): Promise<void> {
  const { apiKey, sender } = getResendConfig()
  const invitationUrl = `${getStaffAppUrl()}/signin?staffInviteToken=${encodeURIComponent(params.token)}`

  await postResendEmail(
    {
      from: sender,
      to: [params.to],
      subject: 'Activez votre compte employe',
      html: renderBrandedEmail({
        preheader: 'Invitation Studio Barber: activez votre compte employe.',
        badge: 'Invitation equipe',
        title: 'Activation du compte employe',
        firstName: params.firstName,
        introLines: [
          "Vous avez ete ajoute(e) a l'equipe.",
          'Choisissez votre mot de passe pour finaliser votre activation.'
        ],
        rows: [{ label: 'Lien valide jusqu au', value: formatDateTime(params.expiresAt) }],
        cta: {
          label: 'Activer mon compte',
          url: invitationUrl
        }
      })
    },
    apiKey
  )
}
