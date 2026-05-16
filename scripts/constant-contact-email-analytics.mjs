#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENV_PATH = process.env.ENV_PATH || path.join(os.homedir(), '.claude', '.env')
const OUT_PATH = path.join(ROOT, 'public/data/constant-contact-email-analytics.json')
const API_BASE = 'https://api.cc.email/v3'
const TOKEN_URL = 'https://authz.constantcontact.com/oauth2/default/v1/token'

const DEFAULT_CAMPAIGN_IDS = [
  'e5b5a45f-9120-4096-9e43-94603582c2c0',
  '06db9219-64a6-4838-8df5-92d5fc94275a',
  '7ac045d8-e33f-4e45-81ce-afbfd42ba05d',
]

function loadEnv(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)=(.*)$/)
    if (!match) continue
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

async function refreshAccessToken(env) {
  if (!env.CC_CLIENT_ID || !env.CC_CLIENT_SECRET || !env.CC_REFRESH_TOKEN) return null
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.CC_REFRESH_TOKEN,
  })
  const auth = Buffer.from(`${env.CC_CLIENT_ID}:${env.CC_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Constant Contact token refresh failed: ${res.status} ${text.slice(0, 180)}`)
  }
  const json = await res.json()
  return json.access_token || null
}

async function main() {
  const env = loadEnv(ENV_PATH)
  let accessToken = env.CC_ACCESS_TOKEN
  if (!accessToken) throw new Error(`CC_ACCESS_TOKEN not found in ${ENV_PATH}`)

  async function cc(endpoint, didRefresh = false) {
    const normalizedEndpoint = endpoint.startsWith('/v3/') ? endpoint.slice(3) : endpoint
    const res = await fetch(`${API_BASE}${normalizedEndpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    if (res.status === 401 && !didRefresh) {
      const refreshed = await refreshAccessToken(env)
      if (refreshed) {
        accessToken = refreshed
        return cc(endpoint, true)
      }
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Constant Contact request failed: ${res.status} ${normalizedEndpoint} ${text.slice(0, 180)}`)
    }
    return res.json()
  }

  async function fetchTrackingActivities(activityId, trackingType) {
    let endpoint = `/reports/email_reports/${activityId}/tracking/${trackingType}?limit=500`
    const activities = []
    while (endpoint) {
      const page = await cc(endpoint)
      activities.push(...(page.tracking_activities || []))
      endpoint = page._links?.next?.href || ''
    }
    return activities
  }

  function ensureRecipient(recipientsByEmail, event) {
    const email = String(event.email_address || '').trim().toLowerCase()
    if (!email) return null
    if (!recipientsByEmail[email]) {
      recipientsByEmail[email] = {
        contact_id: event.contact_id || null,
        email,
        first_name: event.first_name || null,
        last_name: event.last_name || null,
        sent_at: null,
        opened_at: null,
        clicked_at: null,
        click_count: 0,
        last_click_url: null,
        bounced_at: null,
        opted_out_at: null,
        engagement_status: 'Sent, not opened',
      }
    }
    const recipient = recipientsByEmail[email]
    recipient.contact_id ||= event.contact_id || null
    recipient.first_name ||= event.first_name || null
    recipient.last_name ||= event.last_name || null
    return recipient
  }

  function latestTimestamp(currentValue, nextValue) {
    if (!nextValue) return currentValue || null
    if (!currentValue) return nextValue
    return new Date(nextValue).getTime() > new Date(currentValue).getTime() ? nextValue : currentValue
  }

  function applyTrackingEvent(recipientsByEmail, trackingType, event) {
    const recipient = ensureRecipient(recipientsByEmail, event)
    if (!recipient) return
    if (trackingType === 'sends' || trackingType === 'didnotopens') {
      recipient.sent_at = latestTimestamp(recipient.sent_at, event.created_time)
    }
    if (trackingType === 'opens') {
      recipient.opened_at = latestTimestamp(recipient.opened_at, event.created_time)
    }
    if (trackingType === 'clicks') {
      recipient.clicked_at = latestTimestamp(recipient.clicked_at, event.created_time)
      recipient.click_count += 1
      if (event.link_url) recipient.last_click_url = event.link_url
    }
    if (trackingType === 'bounces') {
      recipient.bounced_at = latestTimestamp(recipient.bounced_at, event.created_time)
    }
    if (trackingType === 'optouts') {
      recipient.opted_out_at = latestTimestamp(recipient.opted_out_at, event.created_time)
    }
  }

  function engagementStatus(recipient) {
    if (recipient.bounced_at) return 'Bounced'
    if (recipient.opted_out_at) return 'Opted out'
    if (recipient.clicked_at) return 'Clicked'
    if (recipient.opened_at) return 'Opened'
    return 'Sent, not opened'
  }

  async function fetchRecipients(activityId) {
    const recipientsByEmail = {}
    for (const trackingType of ['sends', 'opens', 'clicks', 'didnotopens', 'bounces', 'optouts']) {
      const events = await fetchTrackingActivities(activityId, trackingType)
      for (const event of events) applyTrackingEvent(recipientsByEmail, trackingType, event)
    }
    return Object.values(recipientsByEmail)
      .map(recipient => ({ ...recipient, engagement_status: engagementStatus(recipient) }))
      .sort((a, b) => {
        const aName = `${a.last_name || ''} ${a.first_name || ''} ${a.email}`
        const bName = `${b.last_name || ''} ${b.first_name || ''} ${b.email}`
        return aName.localeCompare(bName)
      })
  }

  const campaignIds = (process.env.CC_CAMPAIGN_IDS || DEFAULT_CAMPAIGN_IDS.join(','))
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  const campaigns = []
  for (const id of campaignIds) {
    const campaign = await cc(`/emails/${id}`)
    const activity = (campaign.campaign_activities || []).find(item => item.role === 'primary_email')
      || (campaign.campaign_activities || []).find(item => item.role === 'resend')
    if (!activity) continue
    campaigns.push({
      campaign_id: campaign.campaign_id,
      name: campaign.name,
      current_status: campaign.current_status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      activity_id: activity.campaign_activity_id,
      activity_role: activity.role,
    })
  }

  const statsByActivity = {}
  for (let i = 0; i < campaigns.length; i += 10) {
    const ids = campaigns.slice(i, i + 10).map(campaign => campaign.activity_id)
    if (ids.length === 0) continue
    const report = await cc(`/reports/stats/email_campaign_activities/${ids.join(',')}`)
    for (const result of report.results || []) {
      statsByActivity[result.campaign_activity_id] = result
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    source: 'Constant Contact API v3',
    campaigns: [],
  }

  for (const campaign of campaigns) {
    output.campaigns.push({
      ...campaign,
      stats: statsByActivity[campaign.activity_id]?.stats || {},
      last_refresh_date: statsByActivity[campaign.activity_id]?.last_refresh_date || null,
      recipients: await fetchRecipients(campaign.activity_id),
    })
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Wrote ${output.campaigns.length} Constant Contact campaigns to ${OUT_PATH}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
