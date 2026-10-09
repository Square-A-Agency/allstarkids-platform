import { resend } from '@/lib/resend'

const FROM = 'All Star Kids Academy <no-reply@allstarkidsacademyga.com>'
const FOOTER = `<br/><p>All Star Kids Academy<br/>4518 Covington Hwy, Decatur, GA 30035<br/>(Mon to Fri, 6:00 AM to 6:30 PM)</p>`

function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://allstarkids-platform.vercel.app').replace(/\/$/, '')
  return `${base}${path}`
}

export async function sendDocumentsSignedEmail(family: { email: string; firstName: string }): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: family.email,
    subject: 'Your enrollment documents are signed',
    html: `
      <h2>Thank you, ${family.firstName}!</h2>
      <p>Every enrollment document is now signed. Signed copies are saved in your family portal and the school has them on file.</p>
      <p><a href="${appUrl('/dashboard')}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open my family portal</a></p>
      <p>Questions? Email <a href="mailto:info@allstarkidsacademyga.com">info@allstarkidsacademyga.com</a>.</p>
      ${FOOTER}
    `,
  })
}
