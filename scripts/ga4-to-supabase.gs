// Google Apps Script: Pull GA4 metrics and upsert into Supabase data_analytics table
//
// Setup:
//   1. Go to script.google.com → New project → paste this file
//   2. Fill in the CONFIG values below
//   3. Services (+) → Add → Google Analytics Data API
//   4. Run syncLastMonth() once manually to authorize
//   5. Triggers → Add Trigger → syncLastMonth → Month timer

var CONFIG = {
  GA4_PROPERTY_ID: '492911563',
  SUPABASE_URL:    'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY:    'sb_publishable_EbFMfEbyEp3gASl-GZm3tQ_LnPEe5do',
  TABLE:           'data_analytics'
};

// ─── Main entry point ────────────────────────────────────────────────────────

function syncLastMonth() {
  var now   = new Date();
  var year  = now.getFullYear();
  var month = now.getMonth(); // 0-indexed → last month when called in new month
  if (month === 0) { month = 12; year -= 1; }
  syncMonth(year + '-' + String(month).padStart(2, '0'));
}

// Backfill a specific month: syncMonth('2025-01')
function syncMonth(period) {
  var parts     = period.split('-');
  var year      = parseInt(parts[0]);
  var month     = parseInt(parts[1]);
  var startDate = period + '-01';
  var lastDay   = new Date(year, month, 0).getDate();
  var endDate   = period + '-' + String(lastDay).padStart(2, '0');

  Logger.log('Fetching GA4 for ' + period);

  var metrics  = fetchOverview(startDate, endDate);
  if (!metrics) { Logger.log('No overview data for ' + period); return; }

  var channels = fetchChannels(startDate, endDate);
  var payload  = Object.assign({ period: period }, metrics, channels);

  Logger.log('Data: ' + JSON.stringify(payload));
  upsertSupabase(payload);
  Logger.log('Done: ' + period);
}

// ─── GA4: overview metrics ────────────────────────────────────────────────────

function fetchOverview(startDate, endDate) {
  var response = AnalyticsData.Properties.runReport({
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ]
  }, 'properties/' + CONFIG.GA4_PROPERTY_ID);

  if (!response.rows || !response.rows.length) return null;
  var v = response.rows[0].metricValues;
  return {
    sessions:             parseInt(v[0].value)   || 0,
    users:                parseInt(v[1].value)   || 0,
    page_views:           parseInt(v[2].value)   || 0,
    bounce_rate:          parseFloat(v[3].value) || 0,
    avg_session_duration: parseFloat(v[4].value) || 0
  };
}

// ─── GA4: sessions by channel group ──────────────────────────────────────────

function fetchChannels(startDate, endDate) {
  var response = AnalyticsData.Properties.runReport({
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics:    [{ name: 'sessions' }]
  }, 'properties/' + CONFIG.GA4_PROPERTY_ID);

  var result = {
    sessions_organic:  0,
    sessions_paid:     0,
    sessions_direct:   0,
    sessions_referral: 0,
    sessions_social:   0,
    sessions_email:    0,
    sessions_other:    0
  };

  if (!response.rows) return result;

  response.rows.forEach(function(row) {
    var channel = (row.dimensionValues[0].value || '').toLowerCase();
    var count   = parseInt(row.metricValues[0].value) || 0;

    if (channel.indexOf('organic search') !== -1)  result.sessions_organic  += count;
    else if (channel.indexOf('paid search') !== -1) result.sessions_paid     += count;
    else if (channel.indexOf('direct') !== -1)      result.sessions_direct   += count;
    else if (channel.indexOf('referral') !== -1)    result.sessions_referral += count;
    else if (channel.indexOf('social') !== -1)      result.sessions_social   += count;
    else if (channel.indexOf('email') !== -1)       result.sessions_email    += count;
    else                                             result.sessions_other    += count;
  });

  return result;
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

function upsertSupabase(data) {
  var url     = CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.TABLE + '?on_conflict=period';
  var options = {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'apikey':        CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
      'Prefer':        'resolution=merge-duplicates'
    },
    payload:            JSON.stringify(data),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code     = response.getResponseCode();

  if (code >= 200 && code < 300) {
    Logger.log('Upserted period=' + data.period + ' (HTTP ' + code + ')');
  } else {
    Logger.log('Supabase error ' + code + ': ' + response.getContentText());
  }
}
