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
  ACCESS_TOKEN: 'EAAbnYQo9NBEBRbHl18ER5ZATNsKhjribqeZBNdl8cjp6Nm0iy0dDL95ASGgW4FeJHqDhtVoV9eJYI7NzVopUBIaOxNymePyh0l1sbXm04nnpvi4AnlE0HZAvMs08l5FZB6ssXZBMiU98sgF5sbkJoXbnQObc6aZBzi8R5ZAqlBfZBEGTiX4rOAIpHQ4F2XDygfXEWLrSN3i8CZB03yQ4TJkIcT9PW6MiDNtlI3HCdNgxOjpXy0mt1E6tgAwZDZD',
  SUPABASE_URL: 'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY: 'sb_publishable_EbFMfEbyEp3gASl-GZm3tQ_LnPEe5do',
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
  var parts = period.split('-');
  var year  = parseInt(parts[0]);
  var month = parseInt(parts[1]);
  var since = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  var until = Math.floor(new Date(year, month, 1).getTime() / 1000);

  Logger.log('Fetching Facebook data for ' + period);

  var fields    = fetchPageFields();
  var postCount = fetchPostCount(since, until);

  var payload = {
    period:              period,
    page_followers:      fields.followers_count,
    page_impressions:    null,
    page_reach:          null,
    page_engaged_users:  fields.talking_about_count,
    post_count:          postCount
  };

  Logger.log('FB data: ' + JSON.stringify(payload));
  upsertFBSupabase(payload);
  Logger.log('Done: ' + period);
}

// ─── Facebook Graph API ───────────────────────────────────────────────────────

function fetchPageFields() {
  var url = 'https://graph.facebook.com/v19.0/' + FB_CONFIG.PAGE_ID
    + '?fields=followers_count,fan_count,talking_about_count'
    + '&access_token=' + FB_CONFIG.ACCESS_TOKEN;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    Logger.log('FB page fields error: ' + response.getContentText());
    return { followers_count: null, talking_about_count: null };
  }
  var json = JSON.parse(response.getContentText());
  Logger.log('FB page fields: ' + JSON.stringify(json));
  return {
    followers_count:      json.followers_count || json.fan_count || null,
    talking_about_count:  json.talking_about_count || null
  };
}

function fetchPostCount(since, until) {
  var url = 'https://graph.facebook.com/v19.0/' + FB_CONFIG.PAGE_ID + '/published_posts'
    + '?fields=id'
    + '&since=' + since
    + '&until=' + until
    + '&limit=100'
    + '&access_token=' + FB_CONFIG.ACCESS_TOKEN;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();
  if (code !== 200) {
    Logger.log('FB posts error ' + code + ': ' + response.getContentText());
    return null;
  }
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
