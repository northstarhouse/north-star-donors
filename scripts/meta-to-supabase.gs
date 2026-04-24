// Google Apps Script: Pull Facebook Page insights and upsert into Supabase data_facebook table
//
// Setup:
//   1. Go to script.google.com → open your existing Apps Script project (or new one)
//   2. Add this file alongside ga4-to-supabase.gs
//   3. Fill in the CONFIG values below
//   4. Run syncFBLastMonth() once manually
//   5. Triggers → Add Trigger → syncFBLastMonth → Month timer
//
// Token note: Page Access Tokens never expire. If it stops working, regenerate
// at developers.facebook.com → Tools → Graph API Explorer.

var FB_CONFIG = {
  PAGE_ID:      '129807677061224',
  ACCESS_TOKEN: 'EAAcxy0JWyHQBRSt5xOHPG7vdVkQZAyZCZAswEzu0ul1n5v9c1ZCZAtL65lqyHAdWc84MdzVMW2m14lm8b7Yy3tYJsfNyR5qclkVZBIi0y4JGEnTvreuI2cn5ex8D4I6VMWb0ZB7mBqJbZAXZB5ZCGQZBlT6oKZCa9qfxPPxrUJZCNwUqLCyyC7neTZAecJ9aL3leMbqFMTM8oZB7G70tqVAEBqiN8ypiIN8dXMmZCECkGb5OkQXuhvXOA5ljSeWlyKjxDk1ugJA88KVNtrSBR1CuFjavledRZASQl',
  SUPABASE_URL: 'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY: 'PASTE_ANON_KEY_HERE',
  TABLE:        'data_facebook'
};

// ─── Main entry points ────────────────────────────────────────────────────────

function syncFBLastMonth() {
  var now   = new Date();
  var year  = now.getFullYear();
  var month = now.getMonth();
  if (month === 0) { month = 12; year -= 1; }
  syncFBMonth(year + '-' + String(month).padStart(2, '0'));
}

// Backfill: syncFBMonth('2025-01')
function syncFBMonth(period) {
  var parts   = period.split('-');
  var year    = parseInt(parts[0]);
  var month   = parseInt(parts[1]);
  var since   = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  var until   = Math.floor(new Date(year, month, 1).getTime() / 1000);

  Logger.log('Fetching Facebook data for ' + period);

  var insights  = fetchPageInsights(since, until);
  var followers = fetchFollowerCount();
  var postCount = fetchPostCount(since, until);

  var payload = Object.assign({ period: period, page_followers: followers, post_count: postCount }, insights);
  Logger.log('FB data: ' + JSON.stringify(payload));

  upsertFBSupabase(payload);
  Logger.log('Done: ' + period);
}

// ─── Facebook Graph API ───────────────────────────────────────────────────────

function fetchPageInsights(since, until) {
  var metrics = [
    'page_impressions',
    'page_impressions_unique',  // reach
    'page_engaged_users'
  ].join(',');

  var url = 'https://graph.facebook.com/v19.0/' + FB_CONFIG.PAGE_ID + '/insights'
    + '?metric=' + metrics
    + '&period=month'
    + '&since=' + since
    + '&until=' + until
    + '&access_token=' + FB_CONFIG.ACCESS_TOKEN;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code     = response.getResponseCode();

  if (code !== 200) {
    Logger.log('FB insights error ' + code + ': ' + response.getContentText());
    return { page_impressions: null, page_reach: null, page_engaged_users: null };
  }

  var json   = JSON.parse(response.getContentText());
  var result = { page_impressions: null, page_reach: null, page_engaged_users: null };

  (json.data || []).forEach(function(metric) {
    var val = metric.values && metric.values[0] ? metric.values[0].value : null;
    if (metric.name === 'page_impressions')        result.page_impressions    = val;
    if (metric.name === 'page_impressions_unique') result.page_reach          = val;
    if (metric.name === 'page_engaged_users')      result.page_engaged_users  = val;
  });

  return result;
}

function fetchFollowerCount() {
  var url = 'https://graph.facebook.com/v19.0/' + FB_CONFIG.PAGE_ID
    + '?fields=followers_count'
    + '&access_token=' + FB_CONFIG.ACCESS_TOKEN;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return null;
  var json = JSON.parse(response.getContentText());
  return json.followers_count || null;
}

function fetchPostCount(since, until) {
  var url = 'https://graph.facebook.com/v19.0/' + FB_CONFIG.PAGE_ID + '/posts'
    + '?fields=id'
    + '&since=' + since
    + '&until=' + until
    + '&limit=100'
    + '&access_token=' + FB_CONFIG.ACCESS_TOKEN;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return null;
  var json = JSON.parse(response.getContentText());
  return (json.data || []).length;
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

function upsertFBSupabase(data) {
  var url     = FB_CONFIG.SUPABASE_URL + '/rest/v1/' + FB_CONFIG.TABLE + '?on_conflict=period';
  var options = {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'apikey':        FB_CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + FB_CONFIG.SUPABASE_KEY,
      'Prefer':        'resolution=merge-duplicates'
    },
    payload:            JSON.stringify(data),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code     = response.getResponseCode();

  if (code >= 200 && code < 300) {
    Logger.log('Upserted FB period=' + data.period + ' (HTTP ' + code + ')');
  } else {
    Logger.log('Supabase error ' + code + ': ' + response.getContentText());
  }
}
