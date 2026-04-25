// Google Apps Script: Wix analytics + form submissions proxy
//
// Setup:
//   1. Open script.google.com (or any Google Sheet → Extensions → Apps Script)
//   2. Paste this file (replace existing content)
//   3. Deploy → Manage deployments → edit → New version → Deploy
//      (keep "Anyone" access)
//   4. Copy the web app URL into WIX_URL in app/data/page.tsx

var WIX_TOKEN = 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImU0NjhlNTliLTY0NDItNDBkNy1iYWEzLTM1MGMzZmFjYjY2ZFwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcImU0M2YyYjAxLTUxMDktNGM5OC1iMDNlLTg4NTZhZmQwOGY5YlwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCI3ZjM4ODdlZS01ODU2LTRkZTUtOTk3NC03ZjQwZGExODQwYWNcIn19IiwiaWF0IjoxNzc3MTAzMjYxfQ.Jk0Hm9layHNR-d2T5aFWLVAaBZVR-idFFQi6MSppkdynoDb_MQHQ6dL1HR5s0ff3ETnzI4gCnyHBoSN61Kz3SqvHQSKGfxSnwUAstDJSulOTElC66m1sDBEC4BaIyCgROSnNnEgnw2hcCgG4Q8UXyfxZlFsidCsPjxGhhVHLLG1wu3Lp4qTGmjzWc0DKxuydd04c-s6dFIkvwp7bC4Cf1FOFmck88jruoRB16yw_mLP_YVzfWcapxndI4ErcxaOy77KO49NQx1Tv0S-ZBIE1NtCuczycDgT2sMKHoTMqSt9Q5X9kGjQhEKtQuGDn6j1G6Q4XaMamR6IDYEotObZqfQ';
var WIX_SITE  = '675edd2f-6fca-4862-ba5b-af17f015fbb2';

var FORM_NAMES = {
  'cc2315f5-59c6-4c05-a4ba-7b56ece75e0e': 'Newsletter Signup',
  '80aca1bd-2d0d-4d6a-81cd-478d0420d75c': 'General Inquiry',
  '911f8932-085e-4889-be1e-25978ddb1c69': 'Tour Request'
};

function doGet() {
  var analytics = fetchAnalytics();
  var forms     = fetchForms();

  return ContentService
    .createTextOutput(JSON.stringify({ analytics: analytics, forms: forms }))
    .setMimeType(ContentService.MimeType.JSON);
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
  var url  = 'https://www.wixapis.com/form-submission-service/v4/submissions/query';
  var body = JSON.stringify({
    query: {
      filter: { namespace: { '$eq': 'wix.form_app.form' } },
      sort:   [{ fieldName: 'createdDate', direction: 'DESC' }],
      paging: { limit: 1000 }
    }
  });

  var resp = UrlFetchApp.fetch(url, {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'Authorization': WIX_TOKEN,
      'wix-site-id':   WIX_SITE
    },
    payload:            body,
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    Logger.log('Forms error ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return { submissions: [], error: 'HTTP ' + resp.getResponseCode() };
  }

  var data = JSON.parse(resp.getContentText());
  var submissions = (data.submissions || []).map(function(s) {
    return {
      id:         s.id,
      form_id:    s.formId,
      form_name:  FORM_NAMES[s.formId] || 'Other Form',
      status:     s.status,
      created_at: s.createdDate,
      fields:     normalizeFields(s.submissions || {})
    };
  });

  return { submissions: submissions };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

var KEY_LABELS = {
  'long_answer':    'Message',
  'form_field':     'Inquiry Type',
  'form_field_1':   'Phone'
};

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
