// Google Apps Script: Wix analytics + GA4 top pages + form submissions proxy
//
// Setup:
//   1. Open script.google.com (or any Google Sheet → Extensions → Apps Script)
//   2. Paste this file (replace existing content) — no extra Services needed
//   3. Replace appsscript.json with scripts/appsscript.json from the repo (adds analytics OAuth scope)
//   4. Fill in GA4_PROPERTY_ID below (analytics.google.com → Admin → Property Settings → Property ID)
//   5. Deploy → Manage deployments → edit → New version → Deploy  (keep "Anyone" access)
//   6. Copy the web app URL into WIX_URL in app/data/page.tsx

// ── Find your GA4 property ID: analytics.google.com → Admin → Property Settings → Property ID
var GA4_PROPERTY_ID = '492911563';

var WIX_TOKEN = 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImU0NjhlNTliLTY0NDItNDBkNy1iYWEzLTM1MGMzZmFjYjY2ZFwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcImU0M2YyYjAxLTUxMDktNGM5OC1iMDNlLTg4NTZhZmQwOGY5YlwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCI3ZjM4ODdlZS01ODU2LTRkZTUtOTk3NC03ZjQwZGExODQwYWNcIn19IiwiaWF0IjoxNzc3MTAzMjYxfQ.Jk0Hm9layHNR-d2T5aFWLVAaBZVR-idFFQi6MSppkdynoDb_MQHQ6dL1HR5s0ff3ETnzI4gCnyHBoSN61Kz3SqvHQSKGfxSnwUAstDJSulOTElC66m1sDBEC4BaIyCgROSnNnEgnw2hcCgG4Q8UXyfxZlFsidCsPjxGhhVHLLG1wu3Lp4qTGmjzWc0DKxuydd04c-s6dFIkvwp7bC4Cf1FOFmck88jruoRB16yw_mLP_YVzfWcapxndI4ErcxaOy77KO49NQx1Tv0S-ZBIE1NtCuczycDgT2sMKHoTMqSt9Q5X9kGjQhEKtQuGDn6j1G6Q4XaMamR6IDYEotObZqfQ';
var WIX_SITE  = '675edd2f-6fca-4862-ba5b-af17f015fbb2';

var FORM_NAMES = {
  // Optional overrides when you want a custom display title for a known form ID.
};

function doGet() {
  var analytics = fetchAnalytics();
  var forms     = fetchForms();
  var pages     = fetchTopPages();
  var cities    = fetchTopCities();
  var sources   = fetchTopSources();
  var events    = fetchWixEvents();

  return ContentService
    .createTextOutput(JSON.stringify({ analytics: analytics, forms: forms, pages: pages, cities: cities, sources: sources, events: events }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GA4 Top Pages ─────────────────────────────────────────────────────────────
// Uses UrlFetchApp + the deploying user's OAuth token — no advanced service needed.
// The deploying Google account must have Viewer access to the GA4 property.

function fetchTopPages() {
  if (!GA4_PROPERTY_ID) return { rows: [], error: 'GA4_PROPERTY_ID not set' };

  try {
    var url  = 'https://analyticsdata.googleapis.com/v1beta/properties/' + GA4_PROPERTY_ID + ':runReport';
    var body = JSON.stringify({
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 100
    });

    var resp = UrlFetchApp.fetch(url, {
      method:      'POST',
      contentType: 'application/json',
      headers:     { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      payload:     body,
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('GA4 error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      return { rows: [], error: 'HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().substring(0, 300) };
    }

    var report = JSON.parse(resp.getContentText());

    // Normalize paths: strip query strings, trailing slashes, then group duplicates
    var grouped = {};
    (report.rows || []).forEach(function(row) {
      var raw  = row.dimensionValues[0].value;
      var path = raw.split('?')[0].split('#')[0];
      if (path !== '/' && path.slice(-1) === '/') path = path.slice(0, -1);
      if (!path) path = '/';

      var views    = parseInt(row.metricValues[0].value, 10);
      var users    = parseInt(row.metricValues[1].value, 10);
      var sessions = parseInt(row.metricValues[2].value, 10);
      var engRate  = parseFloat(row.metricValues[3].value);
      var avgDur   = parseFloat(row.metricValues[4].value);

      if (!grouped[path]) {
        grouped[path] = { path: path, title: row.dimensionValues[1].value,
          views: 0, users: 0, sessions: 0, _engW: 0, _durW: 0 };
      }
      grouped[path].views    += views;
      grouped[path].users    += users;
      grouped[path].sessions += sessions;
      grouped[path]._engW    += engRate * views;
      grouped[path]._durW    += avgDur  * views;
    });

    var rows = Object.keys(grouped).map(function(p) {
      var g = grouped[p];
      return {
        path:        g.path,
        title:       g.title,
        views:       g.views,
        users:       g.users,
        sessions:    g.sessions,
        engRate:     g.views > 0 ? g._engW / g.views : 0,
        avgDuration: g.views > 0 ? g._durW / g.views : 0
      };
    }).sort(function(a, b) { return b.views - a.views; }).slice(0, 20);

    return { rows: rows, period: 'last 90 days' };
  } catch (e) {
    Logger.log('GA4 error: ' + e);
    return { rows: [], error: String(e) };
  }
}

// ── GA4 Users by City ─────────────────────────────────────────────────────────

function fetchTopCities() {
  if (!GA4_PROPERTY_ID) return { rows: [] };
  try {
    var url  = 'https://analyticsdata.googleapis.com/v1beta/properties/' + GA4_PROPERTY_ID + ':runReport';
    var body = JSON.stringify({
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'city' }, { name: 'region' }],
      metrics:    [{ name: 'totalUsers' }, { name: 'sessions' }],
      orderBys:   [{ metric: { metricName: 'totalUsers' }, desc: true }],
      dimensionFilter: { notExpression: { filter: { fieldName: 'city', stringFilter: { value: '(not set)', matchType: 'EXACT' } } } },
      limit: 15
    });
    var resp = UrlFetchApp.fetch(url, {
      method: 'POST', contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: body, muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) return { rows: [], error: 'HTTP ' + resp.getResponseCode() };
    var report = JSON.parse(resp.getContentText());
    var rows = (report.rows || []).map(function(row) {
      return {
        city:    row.dimensionValues[0].value,
        region:  row.dimensionValues[1].value,
        users:   parseInt(row.metricValues[0].value, 10),
        sessions: parseInt(row.metricValues[1].value, 10)
      };
    });
    return { rows: rows, period: 'last 90 days' };
  } catch (e) {
    return { rows: [], error: String(e) };
  }
}

// ── GA4 Traffic Sources ────────────────────────────────────────────────────────

function fetchTopSources() {
  if (!GA4_PROPERTY_ID) return { rows: [] };
  try {
    var url  = 'https://analyticsdata.googleapis.com/v1beta/properties/' + GA4_PROPERTY_ID + ':runReport';
    var body = JSON.stringify({
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics:    [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }],
      orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10
    });
    var resp = UrlFetchApp.fetch(url, {
      method: 'POST', contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: body, muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) return { rows: [], error: 'HTTP ' + resp.getResponseCode() };
    var report = JSON.parse(resp.getContentText());
    var rows = (report.rows || []).map(function(row) {
      return {
        channel:     row.dimensionValues[0].value,
        sessions:    parseInt(row.metricValues[0].value, 10),
        users:       parseInt(row.metricValues[1].value, 10),
        engRate:     parseFloat(row.metricValues[2].value)
      };
    });
    return { rows: rows, period: 'last 90 days' };
  } catch (e) {
    return { rows: [], error: String(e) };
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────
// Wix only retains 62 days; always fetch from 61 days ago to today.

function fetchAnalytics() {
  var today = new Date();
  var start = new Date(today.getTime() - 61 * 24 * 60 * 60 * 1000);

  var fmt = function(d) {
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  };

  var url = 'https://www.wixapis.com/analytics/v2/site-analytics/data'
    + '?dateRange.startDate=' + fmt(start)
    + '&dateRange.endDate='   + fmt(today)
    + '&measurementTypes=TOTAL_SESSIONS'
    + '&measurementTypes=TOTAL_UNIQUE_VISITORS'
    + '&measurementTypes=TOTAL_FORMS_SUBMITTED'
    + '&measurementTypes=CLICKS_TO_CONTACT';

  var resp = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': WIX_TOKEN,
      'wix-site-id':   WIX_SITE,
      'Accept':        'application/json'
    },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    Logger.log('Analytics error ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return { data: [], error: 'HTTP ' + resp.getResponseCode() };
  }

  return JSON.parse(resp.getContentText());
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function fetchForms() {
  var formNames = fetchFormNamesMap();
  var submissions = fetchAllWixSubmissions().map(function(s) {
    return {
      id:         s.id,
      form_id:    s.formId,
      form_name:  formNames[s.formId] || FORM_NAMES[s.formId] || 'Other Form',
      status:     s.status,
      created_at: s.createdDate,
      fields:     normalizeFields(s.submissions || {})
    };
  });

  return { submissions: submissions };
}

function fetchFormNamesMap() {
  var out = {};
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/form-schema-service/v4/forms/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': WIX_TOKEN,
        'wix-site-id':   WIX_SITE
      },
      payload: JSON.stringify({
        query: {
          filter: { namespace: { '$eq': 'wix.form_app.form' } },
          sort: [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: limit, offset: offset }
        }
      }),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('Form schema error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      break;
    }

    var json = JSON.parse(resp.getContentText());
    var rows = json.forms || json.items || json.results || [];
    rows.forEach(function(form) {
      var id = String(form.id || form.formId || '');
      var name = form.name || form.displayName || form.title || form.formName || (form.properties && form.properties.name) || '';
      if (id && name) out[id] = String(name);
    });

    if (rows.length < limit) break;
    offset += limit;
  }

  for (var id in FORM_NAMES) out[id] = FORM_NAMES[id];
  return out;
}

function fetchAllWixSubmissions() {
  var all = [];
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/form-submission-service/v4/submissions/namespace/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': WIX_TOKEN,
        'wix-site-id':   WIX_SITE
      },
      payload: JSON.stringify({
        query: {
          filter: { namespace: { '$eq': 'wix.form_app.form' } },
          sort: [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: limit, offset: offset }
        }
      }),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('Forms error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      break;
    }

    var data = JSON.parse(resp.getContentText());
    var rows = data.submissions || data.items || data.results || [];
    all = all.concat(rows);
    if (rows.length < limit) break;
    offset += limit;
  }

  return all;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

var KEY_LABELS = {
  'long_answer':    'Message',
  'form_field':     'Inquiry Type',
  'form_field_1':   'Phone'
};

// ── Wix Events ────────────────────────────────────────────────────────────────

var WIX_CLIENT_ID = '46191fb3-0113-44a7-9bd2-031200714fea';

function getWixAnonToken() {
  var resp = UrlFetchApp.fetch('https://www.wixapis.com/oauth2/token', {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({ clientId: WIX_CLIENT_ID, grantType: 'anonymous' }),
    muteHttpExceptions: true
  });
  var json = JSON.parse(resp.getContentText());
  return json.access_token || null;
}

function fetchWixEvents() {
  var token = getWixAnonToken();
  if (!token) { Logger.log('Events: failed to get anon token'); return { events: [], error: 'Could not get access token' }; }

  var all = [];
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/events/v3/events/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': token },
      payload: JSON.stringify({
        query: {
          sort: [{ fieldName: 'scheduling.startDate', order: 'DESC' }],
          paging: { limit: limit, offset: offset }
        }
      }),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('Events error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      return { events: [], error: 'HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().substring(0, 200) };
    }

    var json = JSON.parse(resp.getContentText());
    var rows = json.events || [];

    rows.forEach(function(e) {
      var loc      = e.location || {};
      var sched    = e.scheduling || {};
      var config   = sched.config || {};
      var reg      = e.registration || {};
      var rsvp     = reg.rsvpCollection || null;
      var ticketing = reg.ticketing || null;
      var pageUrl  = e.eventPageUrl || {};

      all.push({
        id:           e.id,
        title:        e.title || '',
        status:       e.status || '',
        start:        config.startDate || null,
        end:          config.endDate   || null,
        location:     loc.name || (loc.address && loc.address.formattedAddress) || '',
        description:  e.description || '',
        rsvp_total:   rsvp     ? (rsvp.total     || 0) : null,
        tickets_sold: ticketing ? (ticketing.totalSold || 0) : null,
        url:          pageUrl.base ? pageUrl.base + (pageUrl.path || '') : null
      });
    });

    if (rows.length < limit) break;
    offset += limit;
  }

  return { events: all };
}

function normalizeFields(raw) {
  var out = {};
  for (var k in raw) {
    var v = raw[k];
    // skip null/empty/boolean-false; convert true → "Yes"
    if (v === null || v === undefined || v === '' || v === false) continue;
    if (v === true) v = 'Yes';

    var clean = k.replace(/_[0-9a-f]{4}$/i, '');  // strip trailing hash like _2fc1
    var label = KEY_LABELS[clean] || KEY_LABELS[k]
      || clean.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

    out[label] = String(v);
  }
  return out;
}
