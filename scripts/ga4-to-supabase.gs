// Google Apps Script: Pull GA4 metrics and upsert into Supabase data_analytics table
//
// Setup:
//   1. Go to script.google.com → New project → paste this file
//   2. Fill in the four CONFIG values below
//   3. Run syncLastMonth() once manually to authorize GA4 + Supabase access
//   4. Add a monthly trigger: Triggers → Add Trigger → syncLastMonth → Month timer
//
// Required Google service: Google Analytics Data API
//   Project Settings → Services → Add → Google Analytics Data API

var CONFIG = {
  GA4_PROPERTY_ID: '492911563',
  SUPABASE_URL:    'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY:    'PASTE_ANON_KEY_HERE',
  TABLE:           'data_analytics'
};

// ─── Main entry point ────────────────────────────────────────────────────────

function syncLastMonth() {
  var now    = new Date();
  var year   = now.getFullYear();
  var month  = now.getMonth(); // 0-indexed, so this is last month when called in the new month
  if (month === 0) { month = 12; year -= 1; }
  var period = year + '-' + String(month).padStart(2, '0');

  var startDate = period + '-01';
  var lastDay   = new Date(year, month, 0).getDate();
  var endDate   = period + '-' + String(lastDay).padStart(2, '0');

  Logger.log('Fetching GA4 data for ' + period + ' (' + startDate + ' to ' + endDate + ')');

  var metrics = fetchGA4(startDate, endDate);
  if (!metrics) { Logger.log('No data returned from GA4'); return; }

  Logger.log('GA4 data: ' + JSON.stringify(metrics));
  upsertSupabase(period, metrics);
  Logger.log('Done.');
}

// Run this manually if you want to backfill a specific month, e.g. syncMonth('2025-01')
function syncMonth(period) {
  var parts     = period.split('-');
  var year      = parseInt(parts[0]);
  var month     = parseInt(parts[1]);
  var startDate = period + '-01';
  var lastDay   = new Date(year, month, 0).getDate();
  var endDate   = period + '-' + String(lastDay).padStart(2, '0');

  var metrics = fetchGA4(startDate, endDate);
  if (!metrics) { Logger.log('No data for ' + period); return; }
  upsertSupabase(period, metrics);
  Logger.log('Synced ' + period);
}

// ─── GA4 Data API ─────────────────────────────────────────────────────────────

function fetchGA4(startDate, endDate) {
  var propertyId = 'properties/' + CONFIG.GA4_PROPERTY_ID;

  var request = {
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ]
  };

  var response = AnalyticsData.Properties.runReport(request, propertyId);

  if (!response.rows || response.rows.length === 0) return null;

  var vals = response.rows[0].metricValues;
  return {
    sessions:              parseInt(vals[0].value)   || 0,
    users:                 parseInt(vals[1].value)   || 0,
    page_views:            parseInt(vals[2].value)   || 0,
    bounce_rate:           parseFloat(vals[3].value) || 0,  // already 0–1
    avg_session_duration:  parseFloat(vals[4].value) || 0   // seconds
  };
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

function upsertSupabase(period, metrics) {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.TABLE + '?on_conflict=period';

  var payload = JSON.stringify(Object.assign({ period: period }, metrics));

  var options = {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'apikey':        CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
      'Prefer':        'resolution=merge-duplicates'
    },
    payload:          payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code     = response.getResponseCode();

  if (code >= 200 && code < 300) {
    Logger.log('Upserted period=' + period + ' (HTTP ' + code + ')');
  } else {
    Logger.log('Supabase error ' + code + ': ' + response.getContentText());
  }
}
