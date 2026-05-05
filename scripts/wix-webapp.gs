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

var WIX_TOKEN = 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImEyZjE1NWVmLWI1NmQtNDJkMi1iYmU1LWQyOTRjN2E2NTMxMVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjljZWJmZjBkLTdjZmYtNDc1MS05ZjdjLTE4MDM4ZDY3ODEzNFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCI3ZjM4ODdlZS01ODU2LTRkZTUtOTk3NC03ZjQwZGExODQwYWNcIn19IiwiaWF0IjoxNzc3OTMyNDY1fQ.K7nZd4YdgQKS13JPNnFYBQ6KH7IZyK40Qhk_z9hHg_2V7U1wiefXMgwSmV4wBM66fPTLe4MJr6i0cD8bbmzefKj5hvfGQ-gNPddcYnCNjQtoDcmqU46eeYE-yDNNUILEqYiJ85MKp1Bf-9PoFLOyhMRYb_HQxMol_iM78X8kB-PxVVLlBGQoZ4fyCr4-YWYbdeaNZkRrQibB1uMAuTvxM9FDrCdna7n_m6DxRd-RC7Su6OiM_9G1zmWpWX4stuSKh0wsPHrVPItQyjjZ_1hLfsiU65UUTkEvUd9kjxNB3cjWl772lNXbVKGxKEMzFacxntCvznWLeLY-M5AfXgP-0Q';
var WIX_SITE  = '675edd2f-6fca-4862-ba5b-af17f015fbb2';

var EVENT_REVENUE_SHEET_ID = '1VcV4DksZpcZX6SxTteYJDvbaOB2qSBDDzDALiynWdgM';

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

function fetchWixEvents() {
  var events = [];
  try {
    var spreadsheet = SpreadsheetApp.openById(EVENT_REVENUE_SHEET_ID);

    // Read ticket prices from "Ticket Prices" tab: [Event Name, Ticket Price]
    var priceMap = {};
    var priceSheet = spreadsheet.getSheetByName('Ticket Prices');
    if (priceSheet) {
      var priceRows = priceSheet.getDataRange().getValues();
      for (var p = 1; p < priceRows.length; p++) {
        var pRow = priceRows[p];
        if (pRow[0] && pRow[1]) {
          var key = String(pRow[0]).trim().toLowerCase();
          var price = parseFloat(pRow[1]);
          if (!isNaN(price) && price > 0) priceMap[key] = price;
        }
      }
    }

    // eventMap accumulates { revenue, tickets } across both tabs
    var eventMap = {};

    // "Wix Tickets" tab: [Event title, Order Amount, Fees, Net, Order Date, ...]
    // No direct ticket count — tickets calculated later from price
    var wixSheet = spreadsheet.getSheetByName('Wix Tickets');
    if (wixSheet) {
      var wixRows = wixSheet.getDataRange().getValues();
      for (var i = 1; i < wixRows.length; i++) {
        var row = wixRows[i];
        if (row[0]) {
          var title = String(row[0]).trim();
          var amount = parseFloat(row[1]) || 0;
          if (!eventMap[title]) eventMap[title] = { revenue: 0, tickets: null };
          eventMap[title].revenue += amount;
        }
      }
    }

    // "Past Events" tab: [Event name, Order date, Number of tickets, Buyer's info, Email,
    //                      Ticket total, Benefit applied, Coupon applied, Tax,
    //                      Wix service fee, Buyer paid, Your revenue, Payment status, Payment method]
    // Ticket count is col C (index 2); revenue is col L (index 11)
    var pastSheet = spreadsheet.getSheetByName('Past Events');
    if (pastSheet) {
      var pastRows = pastSheet.getDataRange().getValues();
      for (var j = 1; j < pastRows.length; j++) {
        var prow = pastRows[j];
        if (prow[0]) {
          var ptitle = String(prow[0]).trim();
          var ptickets = parseInt(prow[2]) || 0;
          var prevenue = parseFloat(prow[11]) || 0;
          if (!eventMap[ptitle]) eventMap[ptitle] = { revenue: 0, tickets: 0 };
          eventMap[ptitle].revenue += prevenue;
          if (eventMap[ptitle].tickets === null) eventMap[ptitle].tickets = 0;
          eventMap[ptitle].tickets += ptickets;
        }
      }
    }

    for (var eventTitle in eventMap) {
      var data = eventMap[eventTitle];
      var ticketPrice = priceMap[eventTitle.toLowerCase()] || null;
      var ticketsSold = data.tickets !== null
        ? data.tickets
        : (ticketPrice && data.revenue > 0 ? Math.round(data.revenue / ticketPrice) : null);

      events.push({
        id:           eventTitle.toLowerCase().replace(/\s+/g, '-'),
        title:        eventTitle,
        status:       'PUBLISHED',
        start:        null,
        end:          null,
        description:  '',
        rsvp_total:   null,
        tickets_sold: ticketsSold,
        ticket_price: ticketPrice,
        revenue:      data.revenue > 0 ? data.revenue : null,
        currency:     'USD',
        url:          null
      });
    }
  } catch (e) {
    Logger.log('Sheet fetch error: ' + e);
  }

  return { events: events };
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
