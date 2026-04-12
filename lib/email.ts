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

/** Used when `emails/sign-in-code.html` is missing (e.g. some serverless bundles). Same placeholders. */
const SIGN_IN_CODE_HTML_FALLBACK = `<!DOCTYPE html>
<html><body style="margin:0;font-family:system-ui,sans-serif;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="height:5px;background:linear-gradient(90deg,#365bd0,#6a8fff,#99b3ff);border-radius:16px 16px 0 0;"></td></tr>
<tr><td style="padding:40px;">
<p style="text-align:center;font-size:28px;font-weight:800;color:#17264f;margin:0;">TagTale</p>
<p style="text-align:center;color:#6b7280;font-size:14px;margin:8px 0 24px;">Social stories for every object</p>
<h1 style="font-size:20px;color:#111827;margin:0 0 12px;">Your sign-in code</h1>
<p style="color:#374151;line-height:1.6;margin:0 0 24px;">Enter this code on the login page. Expires in 15 minutes.</p>
<p style="text-align:center;font-size:32px;font-weight:800;letter-spacing:0.35em;font-family:ui-monospace,monospace;color:#111827;margin:0 0 24px;">{{CODE}}</p>
<p style="text-align:center;"><a href="{{LOGIN_URL}}" style="display:inline-block;background:#4b74f4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;">Open TagTale</a></p>
<p style="color:#9ca3af;font-size:13px;text-align:center;margin-top:24px;">If you didn&apos;t request this, ignore this email.</p>
<p style="color:#9ca3af;font-size:12px;text-align:center;"><a href="{{BASE_URL}}" style="color:#6a8fff;">{{BASE_URL_DISPLAY}}</a></p>
</td></tr></table></td></tr></table></body></html>`

/**
 * Renders `emails/sign-in-code.html` when present; otherwise uses an inline fallback (serverless-safe).
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
    try {
      const filePath = path.join(process.cwd(), 'emails', 'sign-in-code.html')
      cachedSignInCodeTemplate = readFileSync(filePath, 'utf8')
    } catch {
      cachedSignInCodeTemplate = SIGN_IN_CODE_HTML_FALLBACK
    }
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

  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it in your host environment (e.g. Netlify → Environment variables).'
    )
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
