import { readFileSync } from 'fs'
import path from 'path'
import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY')
  return new Resend(key)
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'TagTale <noreply@tagtale.app>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333'

function isDev() {
  return process.env.NODE_ENV === 'development' || process.env.RESEND_API_KEY === 're_dev_placeholder'
}

let cachedSignInCodeTemplate: string | null = null

/**
 * Renders `emails/sign-in-code.html` (same template you can paste into Resend or other ESPs).
 * Placeholders: {{CODE}}, {{LOGIN_URL}}, {{BASE_URL}}, {{BASE_URL_DISPLAY}}
 */
export function renderSignInCodeEmailHtml(code: string): string {
  const base = BASE_URL.replace(/\/$/, '')
  const loginUrl = `${base}/login`
  let baseDisplay = base
  try {
    baseDisplay = new URL(base.startsWith('http') ? base : `https://${base}`).host
  } catch {
    // keep full URL for display
  }

  if (!cachedSignInCodeTemplate) {
    const filePath = path.join(process.cwd(), 'emails', 'sign-in-code.html')
    cachedSignInCodeTemplate = readFileSync(filePath, 'utf8')
  }

  const safeCode = code.replace(/[^\d]/g, '').slice(0, 12)

  return cachedSignInCodeTemplate.replace(/\{\{CODE\}\}/g, safeCode)
    .replace(/\{\{LOGIN_URL\}\}/g, loginUrl)
    .replace(/\{\{BASE_URL\}\}/g, base)
    .replace(/\{\{BASE_URL_DISPLAY\}\}/g, baseDisplay)
}

/** @deprecated Legacy URL sign-in; new accounts use email OTP via sendEmailLoginCode */
export async function sendMagicLink(email: string, token: string): Promise<void> {
  const magicUrl = `${BASE_URL}/verify?token=${token}`

  if (isDev()) {
    console.log('\n📧 [DEV] Magic link for', email)
    console.log('👉', magicUrl, '\n')
    return
  }

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🔗 Your TagTale Magic Link',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fafafa;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 800; color: #c026d3; margin: 0;">TagTale</h1>
              <p style="color: #6b7280; margin-top: 8px;">Social media for every object</p>
            </div>
            <h2 style="font-size: 20px; color: #111827; margin-bottom: 16px;">Your magic link is here ✨</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 32px;">
              Click the button below to sign in. This link expires in 15 minutes and can only be used once.
            </p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${magicUrl}"
                 style="display: inline-block; background: #c026d3; color: white; text-decoration: none;
                        padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Sign In to TagTale
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center;">
              If you didn't request this, you can safely ignore this email.<br/>
              This link will expire in 15 minutes.
            </p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`)
  }
}

export async function sendEmailLoginCode(email: string, code: string): Promise<void> {
  if (isDev()) {
    console.log('\n📧 [DEV] Sign-in code for', email)
    console.log('👉', code, '\n')
    return
  }

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your TagTale sign-in code',
    html: renderSignInCodeEmailHtml(code),
  })

  if (error) {
    throw new Error(`Failed to send sign-in code: ${error.message}`)
  }
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  if (isDev()) {
    console.log(`\n📧 [DEV] Welcome email for ${username} (${email})\n`)
    return
  }
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Welcome to TagTale, ${username}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            <h1 style="font-size: 28px; font-weight: 800; color: #c026d3;">Welcome, ${username}! 🎉</h1>
            <p style="color: #374151; line-height: 1.6;">
              You're now part of TagTale — the social network for every object.<br/><br/>
              Start by scanning a QR code on any tagged object to see its story, or create a new object and add its tag to something special.
            </p>
            <a href="${BASE_URL}/feed"
               style="display: inline-block; background: #c026d3; color: white; text-decoration: none;
                      padding: 14px 32px; border-radius: 10px; font-weight: 600; margin-top: 16px;">
              Explore Your Feed
            </a>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Failed to send welcome email:', error)
  }
}
