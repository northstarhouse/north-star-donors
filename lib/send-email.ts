'use client'

import { getAppToken } from './app-token'
import { supabaseAnonKey } from './supabase/client'

const SEND_EMAIL_URL = 'https://uvzwhhwzelaelfhfkvdb.supabase.co/functions/v1/send-email'

interface SendEmailPayload {
  bcc: string[]
  subject: string
  body: string
  sender: string
}

export async function sendEmail(payload: SendEmailPayload) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  })
  const token = getAppToken()
  if (token) headers.set('x-app-token', token)

  return fetch(SEND_EMAIL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}
